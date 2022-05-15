# ECS Fargate Custom Logging with Fluent Bit

## Motivation

AWS Elastic Container Registry provides an easy way of managing logs for containers and our micro-services running inside those containers. Having seamless integration with CloudWatch Logs, containers deployed on ECS Fargate have their standard output piped to CloudWatch Logs. This is made possible by `awslogs` log driver, which runs outside of the container and it is fully managed by AWS.

Using `awslogs` with CloudWatch may be fine for most of the use cases, although we might have several reasons for using a third party log aggregated.

For example:

- we may want to stream logs to S3 directly, bypassing CloudWatch Logs;
- we may want to use a company-wide log aggregator based on ELK stack (or insert other log aggregator here);
- we may want to have better searching and traceability compared to what CloudWatch Log Insights offers;
- we may want to avoid high ingestion price offered by CloudWatch Logs. This might not be as obvious at first, having a huge cluster of microservices with steady log flow may drive the monthly costs up significantly

## Introduction to FluentBit

At this point we might have taken the decision to store our logs outside of CloudWatch. The next challenge we are facing is how to stream our logs to our aggregator. One option would be to use a log router named [Fluent Bit](https://docs.fluentbit.io/manual). Fluent Bit is a lightweight agent with the sole purpose to gather log messages from our containers and stream them into a log aggregator. Fluent Bit provides a set of [plugins](https://docs.fluentbit.io/manual/pipeline/outputs) for integrating with essentially all known log aggregators. Moreover, it can collect logs from several sources in several formats, it can transform this messages offering a seamless integration between a producer service and a consumers (which can be even CloudWatch).

Fluent Bit is fully supported by AWS ECS and AWS ECS Fargate. AWS provides a custom log driver name [`FireLens`](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/using_firelens.html) for making possible the integration with the FluentBit agent. AWS also offers a custom Docker image for Fluent Bit, which will be used further on in this article.

## Base Infrastructure Setup

What we would want to achieve is to deploy a Fargate cluster with an nginx container using Fluent Bit. For being able to do this, we might want to provision some basic infrastructure first. We need a VPC with a few subnets which do have access to internet. We will use Terraform in this article to easily spin up this infrastructure and also to provide a blueprint for the reader which can be easily reproducible. This article wont go into the inner workings of Terraform and expects the reader to have basic familiarity with its deployment process (or with any kind IoC deployment tool working process).

Let's assume we already have a base VPC with 4 subnets (2 public and 2 private subnet), an Internet Gateway and a NAT Gateway. The reason why we would want 4 subnets is redundancy and high availability (HA), which is a requirement for the Application Load Balancer we are planning to use for our ECS cluster. The Application Load Balancers requires to be deployed in at least 2 subnets with different availability zones. We will deploy the ALB in the provision public subnets, while any running ECS container will be places in a private subnet. Terraform code for provisioning the base infrastructure can be found in the following git repository: [https://github.com/Ernyoke/aws-fargate-fluentbit](https://github.com/Ernyoke/aws-fargate-fluentbit).

## ECS Cluster Setup

For ECS cluster setup first we need to provision an Application Load Balancer. ECS services will be automatically registered to this load balancer. For security purposes ant follow best practices, we would allow for the running containers to be able to communicate with the load balancer only. To achieve this, we will provision our ECS infrastructure as follows:

```bash
# Create a Security Group for the Application Load Balancer
resource "aws_security_group" "fluent_bit_alb_sg" {
  name        = "fluent-bit-alb-sg"
  description = "Controls access to the ALB"
  vpc_id      = aws_vpc.fluent_bit_vpc.id

  ingress {
    protocol    = "TCP"
    from_port   = 80
    to_port     = 80
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Create the Application Load Balancer
resource "aws_alb" "fluent_bit_alb" {
  name            = "fluent-bit-alb"
  subnets         = aws_subnet.fluent_bit_public_subnet[*].id
  security_groups = [aws_security_group.fluent_bit_alb_sg.id]
}

# Create a HTTP target group for the nginx service
resource "aws_alb_target_group" "fluent_bit_tg" {
  name        = "fluent-bit-tg"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.fluent_bit_vpc.id
  target_type = "ip"
}

# Redirect all traffic from the Application Load Balancer to the Target Group
resource "aws_alb_listener" "fluent_bit_listener" {
  load_balancer_arn = aws_alb.fluent_bit_alb.id
  port              = 80
  protocol          = "HTTP"

  default_action {
    target_group_arn = aws_alb_target_group.fluent_bit_tg.id
    type             = "forward"
  }
}
```

We provision the ECS cluster with a Fargate service and a security group allowing traffic from the ALB ony:

```bash
# Allow traffic from the Application Load Balancer to the ECS task
resource "aws_security_group" "fluent_bit_task_sg" {
  name        = "fluent-bit-task-sg"
  description = "Allow inbound access from the ALB only"
  vpc_id      = aws_vpc.fluent_bit_vpc.id

  ingress {
    protocol        = "TCP"
    from_port       = var.container_port
    to_port         = var.container_port
    security_groups = [aws_security_group.fluent_bit_alb_sg.id]
  }

  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Create ECS cluster
resource "aws_ecs_cluster" "fluentbit_cluster" {
  name = "fluent-bit-ecs-cluster"
}

# Create Fargate service inside the cluster
resource "aws_ecs_service" "fluent_bit_service" {
  name            = "fluent-bit-service"
  cluster         = aws_ecs_cluster.fluentbit_cluster.id
  task_definition = aws_ecs_task_definition.nginx_fluent_bit.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    security_groups = [aws_security_group.fluent_bit_task_sg.id]
    subnets         = aws_subnet.fluent_bit_private_subnet[*].id
  }

  load_balancer {
    target_group_arn = aws_alb_target_group.fluent_bit_tg.id
    container_name   = "nginx-fluentbit"
    container_port   = var.container_port
  }

  depends_on = [aws_alb_listener.fluent_bit_listener]
}
```

## Building the Task Definition

In order to deploy a container to ECS Fargate, we need to create a ECS task. Each ECS task requires a task definition. This task definition contains all the properties needed for the container to run, including the location of the image. ECS also supports [sidecar container pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/sidecar), which would be a outstanding solution for having separation of concerns between the primary container and peripheral task such as log routing.

An example for task definition having an `nginx` container as the primary container and a `fluent bit` container for log routing would be the following ([source](https://docs.aws.amazon.com/AmazonECS/latest/userguide/firelens-example-taskdefs.html)):

```
{
    "family": "firelens-example-cloudwatch",
    "taskRoleArn": "arn:aws:iam::123456789012:role/ecs_task_iam_role",
    "containerDefinitions": [
        {
            "essential": true,
            "image": "906394416424.dkr.ecr.us-west-2.amazonaws.com/aws-for-fluent-bit:latest",
            "name": "log_router",
            "firelensConfiguration": {
                "type": "fluentbit"
            },
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": "firelens-container",
                    "awslogs-region": "us-west-2",
                    "awslogs-create-group": "true",
                    "awslogs-stream-prefix": "firelens"
                }
            },
            "memoryReservation": 50
         },
         {
             "essential": true,
             "image": "httpd",
             "name": "app",
             "logConfiguration": {
                 "logDriver":"awsfirelens",
                 "options": {
                    "Name": "cloudwatch",
                    "region": "us-west-2",
                    "log_group_name": "firelens-blog",
                    "auto_create_group": "true",
                    "log_stream_prefix": "from-fluent-bit",
                    "log-driver-buffer-limit": "2097152" 
                }
            },
            "memoryReservation": 100 
            }
    ]
}
```

We can notice that this task definition contains a Fluent Bit image provided by AWS and it is using FireLens as the log driver. Also, we can notice that Fluent Bit is configured to stream logs into CloudWatch. We may ask, why would we need Fluent Bit in this case, since AWS can transfer container logs to CloudWatch by default. Before integrating with a third party consumer, it would be easier to validate the whole log routing with CloudWatch. Moreover, the CloudWatch plugin can provide cross-account logging, which we wont use at the moment.

The Terraform equivalent of the task definition would be the following:

```
resource "aws_ecs_task_definition" "nginx_fluent_bit" {
  family                   = "nginx-fluent-bit"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cpu
  memory                   = var.memory

  container_definitions = templatefile("task.tftpl", {
    fargate_cpu    = var.cpu
    fargate_memory = var.memory
    app_image      = var.img
    port           = var.container_port
    aws_region     = var.aws_region
  })

  execution_role_arn = aws_iam_role.fluent_bit_task_role.arn
  task_role_arn      = aws_iam_role.fluent_bit_task_role.arn
}
```

`task.tfpl` template file:

```
[
    {
    "essential": true,
    "image": "906394416424.dkr.ecr.us-east-1.amazonaws.com/aws-for-fluent-bit:latest",
    "name": "fluentbit-log-router",
    "firelensConfiguration": {
      "type": "fluentbit"
    },
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "firelens-container",
        "awslogs-region": "${aws_region}",
        "awslogs-create-group": "true",
        "awslogs-stream-prefix": "firelens"
      }
    },
    "memoryReservation": 50
  },
  {
    "cpu": ${fargate_cpu},
    "image": "${app_image}",
    "memory": ${fargate_memory},
    "name": "nginx-fluentbit",
    "networkMode": "awsvpc",
    "essential": true,
    "portMappings": [
      {
        "containerPort": ${port},
        "hostPort": ${port}
      }
    ],
    "logConfiguration": {
      "logDriver": "awsfirelens",
      "options": {
        "Name": "cloudwatch",
        "region": "${aws_region}",
        "auto_create_group": "true",
        "log_group_name": "fluent-bit-cloudwatch",
        "log_stream_prefix": "from-fluent-bit-nginx",
        "sts_endpoint": "sts.amazonaws.com"
      }
    }
  }
]
```

The task definition requires an execution role. This role is assumed by ECS service and it is used while deploying and setting up the container. The task definition can also have a task role. This role is attached to the containers and it provides permission for the running containers themselves. For simplicity, we will use the same role for the task and for the execution roles.

```
resource "aws_iam_role" "fluent_bit_task_role" {
  name = "fluent-bit-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "fluent_bit_task_policy" {
  name        = "fluent_bit_task_policy"
  path        = "/"
  description = "Task policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:CreateLogGroup",
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Effect   = "Allow"
        Resource = "*"
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "fluent_bit_task_role_attachment" {
  role       = aws_iam_role.fluent_bit_task_role.id
  policy_arn = aws_iam_policy.fluent_bit_task_policy.arn
}
```

## Fluent Bit Configuration for Streaming Logs to S3

Moving on, we would want to be able to stream log messages directly to S3. While it would be possible to accomplish streaming logs from CloudWatch to S3, in this case we would want to bypass CloudWatch log ingestion. 

By default, Fluent Bit requires a [configuration file](https://docs.fluentbit.io/manual/v/1.2/configuration/file). An example for this configuration file which would allow streaming logs to S3 would be the following:

```
[INPUT]
    Name forward
    unix_path /var/run/fluent.sock
    Mem_Buf_Limit 100MB

[OUTPUT]
    Name                         s3
    Match                        *
    bucket                       fluent-bit-log-12345
    region                       us-east-1
    s3_key_format                /$TAG[2]/$TAG[0]/%Y/%m/%d/%H/%M/%S/$UUID.gz
    s3_key_format_tag_delimiters .-
```

In case of Fargate tasks, this configuration file should be baked in the image, for which we will see an example bellow. Before that, we might have noticed that in our task definition above, we did not provide such configuration file. The reason why we did not have to provide it, is that we are using a Fluent Bit image provided by AWS. This image has plugins for AWS services such as CloudWatch, Kinesis Firehose, S3. It also can generate configuration files based on the `logConfiguration` - `options` section for the Fluent Bit task definition. In this case, we would use the previous Fluentbit config file which we would bake it inside our Docker image. The task definition would be as follows:

```
{
  "essential": true,
  "image": "<id>.dkr.ecr.us-east-1.amazonaws.com/fluent-bit-s3:latest"
  "name": "fluentbit-log-router",
  "firelensConfiguration": {
    "type": "fluentbit"
  },
  "logConfiguration": {
    "logDriver": "awslogs",
    "options": {
      "awslogs-group": "firelens-container",
      "awslogs-region": "${aws_region}",
      "awslogs-create-group": "true",
      "awslogs-stream-prefix": "firelens"
    }
  },
  "memoryReservation": 50
},
```

The Docker image with the configuration FluentBit configuration file is as simple as this:

```
FROM amazon/aws-for-fluent-bit:latest
ADD s3.conf /fluent-bit/alt/fluent-bit.conf
CMD ["/fluent-bit/bin/fluent-bit", "-c", "/fluent-bit/alt/fluent-bit.conf"]
```

We build this image with the usual Docker build command:

```
docker buildx build --platform linux/amd64 -t fluent-bit-s3 .
```

Also, we need to push this image to a registry from which ECS would be able to pull it. We can use Elastic Container Registry (ECR) for storing our Docker images. We can create an ECR repository with the following Terraform definition:

```
resource "aws_ecr_repository" "fluentbit_repository" {
  name                 = var.repo_name
  image_tag_mutability = "MUTABLE"
}

output "fluent_bit_registry_url" {
  value = aws_ecr_repository.fluentbit_repository.repository_url
}
```

When the registry is ready, we can tag our image and push it to the registry. I recommend following the `Push Commands` provided by the registry. This push commands are a set of Docker commands for build and push the image. 

Two more things left to do is to create an S3 bucket in which we can stream logs and provision a policy for the task role for being able to write in this S3 bucket. We can create the S3 bucket as follows:

```
resource "aws_s3_bucket" "fluentbit_logging_bucket" {
  bucket = "fluent-bit-log-12345"
}

resource "aws_s3_bucket_acl" "fluentbit_logging_bucket_acl" {
  bucket = aws_s3_bucket.fluentbit_logging_bucket.id
  acl    = "private"
}
```

We could provision the following policy and attach it to the task role:

```
resource "aws_iam_policy" "fluent_bit_task_policy_s3_write" {
  name        = "fluent_bit_task_policy_allow_s3_write"
  path        = "/"
  description = "Task policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:PutObject"
        ]
        Effect   = "Allow"
        Resource = ["arn:aws:s3:::${aws_s3_bucket.fluentbit_logging_bucket.bucket}/*"]
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "fluent_bit_task_role_s3_write_attachment" {
  role       = aws_iam_role.fluent_bit_task_role.id
  policy_arn = aws_iam_policy.fluent_bit_task_policy_s3_write.arn
}
```

Deploying these, we should be able to see gzipped JSON files appearing in our S3 bucket.

## Putting Things Together

The code for this project with instructions to deploy everything can be found on GitHub: [https://github.com/Ernyoke/aws-fargate-fluentbit](https://github.com/Ernyoke/aws-fargate-fluentbit)

## References

1. Fluent Bit Manual: [https://docs.fluentbit.io/manual](https://docs.fluentbit.io/manual)
2. Fluent Bit Output Plugins: [https://docs.fluentbit.io/manual/pipeline/outputs](https://docs.fluentbit.io/manual/pipeline/outputs)
3. Custom log routing: [https://docs.aws.amazon.com/AmazonECS/latest/developerguide/using_firelens.html](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/using_firelens.html)
4. Sidecar pattern: [https://docs.microsoft.com/en-us/azure/architecture/patterns/sidecar](https://docs.microsoft.com/en-us/azure/architecture/patterns/sidecar)
5. Example of task definitions for Fluent Bit: [https://docs.aws.amazon.com/AmazonECS/latest/userguide/firelens-example-taskdefs.html](https://docs.aws.amazon.com/AmazonECS/latest/userguide/firelens-example-taskdefs.html)
6. Fluent Bit configuration file: [https://docs.fluentbit.io/manual/v/1.2/configuration/file](https://docs.fluentbit.io/manual/v/1.2/configuration/file)