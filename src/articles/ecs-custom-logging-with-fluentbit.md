# ECS Fargate Custom Logging with Fluent Bit

## Motivation

AWS Elastic Container Service provides an easy way to manage logs for containers and microservices deployed within those containers. With seamless integration into CloudWatch, containers running on ECS Fargate have their standard output piped directly to CloudWatch Logs. This is made possible by the `awslogs` log driver, which runs outside the container and is fully managed by AWS.

Using `awslogs` with CloudWatch may be sufficient for most use cases; however, there are several reasons one might prefer using a third-party log aggregator.

For example:

- we may want to stream logs directly to S3, bypassing CloudWatch Logs;
- we may need to integrate with a company-wide log aggregator based on the ELK stack (or another log aggregation solution);
- we may require better search capabilities and traceability than what CloudWatch Log Insights offers;
- we may want to reduce costs, as CloudWatch Logs' ingestion pricing can become significant. While this might not be immediately obvious, a large cluster of microservices with a steady log flow can drive up monthly expenses considerably.

## Introduction to FluentBit

[Fluent Bit](https://docs.fluentbit.io/manual) is a lightweight agent designed specifically to collect log messages from containers and stream them into a log aggregator. It provides a wide range of plugins[^1] for integrating with nearly all known log aggregators. Additionally, it can collect logs from multiple sources in various formats, transform log messages, and facilitate seamless integration between producer services and consumers.

Fluent Bit is fully supported by AWS ECS and AWS ECS Fargate. AWS provides a custom log driver called `FireLens`[^2], which enables integration with the Fluent Bit agent. Additionally, AWS offers a custom Docker image for Fluent Bit, which will be used later in this article.

## Base Infrastructure Setup

To demonstrate how ECS Fargate and Fluenbit work togedher, we will deploy a Fargate cluster with an Nginx container using Fluent Bit. To achieve this, we first need to provision some basic infrastructure. Specifically, we require a VPC with a few subnets that have internet access.

In this article, we will use Terraform to quickly set up this infrastructure and provide a blueprint for the reader. However, we will not cover the inner workings of Terraform in detail. This article assumes that the reader has a basic understanding of Terraform's deployment process (or the general workflow of any Infrastructure-as-Code (IaC) tool).

Let's assume we already have a base VPC with four subnets (two public and two private), an Internet Gateway, and a NAT Gateway. The reason for using four subnets is mainly best practice, to ensure redundancy and high availability (HA).

The Application Load Balancer (ALB), which we plan to use for the ECS cluster, must be deployed in at least two subnets across different availability zones. We will deploy the ALB in the public subnets, while any running ECS containers will be placed in the private subnets.

The Terraform code for provisioning the base infrastructure can be found in the following Git repository: [https://github.com/Ernyoke/aws-fargate-fluentbit](https://github.com/Ernyoke/aws-fargate-fluentbit).

## ECS Cluster Setup

For our ECS cluster setup, we first need to provision an Application Load Balancer. ECS services will be automatically registered with this load balancer. For security purposes and to follow best practices, we will allow the running containers to communicate only with the load balancer. To achieve this, we will provision our ECS infrastructure as follows:

```terraform
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

```terraform
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

To deploy a container to ECS Fargate, we need to create an ECS task. Each ECS task requires a task definition, which contains all the necessary properties for the container to run, including the image location in ECR. ECS also supports the [sidecar container pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/sidecar), which is an excellent solution for separating concerns between the primary container and peripheral tasks such as log routing.

An example of a task definition having an `nginx` container as the primary container and a `fluent bit` container for the sidecar log routing would be the following[^3]:

```json
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

We can see that this task definition includes a Fluent Bit image provided by AWS and uses FireLens as the log driver. Additionally, Fluent Bit is configured to stream logs to CloudWatch. One might ask why Fluent Bit is needed, given that AWS can transfer container logs to CloudWatch by default. Before integrating with a third-party consumer, it is easier to validate the entire log routing process with CloudWatch. Moreover, the CloudWatch plugin supports cross-account logging, though we won’t be using that feature at the moment.

The Terraform equivalent of the task definition would be the following:

```terraform
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

```json
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

The task definition requires an execution role, which is assumed by the ECS service and used during container deployment and setup. Additionally, the task definition can specify a task role, which is attached to the containers and grants permissions to the running containers themselves. For simplicity, we will use the same role for both the task role and the execution role.

```terraform
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

Moving forward, we want to stream log messages directly to S3. While it is possible to stream logs from CloudWatch to S3, in this case, we prefer to bypass CloudWatch log ingestion.

By default, Fluent Bit requires a [configuration file](https://docs.fluentbit.io/manual/v/1.2/configuration/file). An example of a configuration file that enables log streaming to S3 is as follows::

```bash
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

For Fargate tasks, this configuration file should be baked into the image, as we will demonstrate below. Before that, you may have noticed that our previous task definition used with CloudWatch integration did not include such a configuration file. The reason we didn’t need to provide one is that we are using a Fluent Bit image provided by AWS. It can generate the configuration file based on the `logConfiguration` -> `options` section of the Fluent Bit task definition. For this example will stick to the hand-crafted Fluent Bit configuration file and we will bake it into our Docker image. The corresponding task definition would be as follows:

```json
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

```bash
FROM amazon/aws-for-fluent-bit:latest
ADD s3.conf /fluent-bit/alt/fluent-bit.conf
CMD ["/fluent-bit/bin/fluent-bit", "-c", "/fluent-bit/alt/fluent-bit.conf"]
```

We build this image with the usual Docker build command:

```bash
docker buildx build --platform linux/amd64 -t fluent-bit-s3 .
```

Additionally, we need to push this image to a registry that ECS can pull from. We can use Elastic Container Registry (ECR) to store our Docker images. The following Terraform definition creates an ECR repository:

```terraform
resource "aws_ecr_repository" "fluentbit_repository" {
  name                 = var.repo_name
  image_tag_mutability = "MUTABLE"
}

output "fluent_bit_registry_url" {
  value = aws_ecr_repository.fluentbit_repository.repository_url
}
```

Once the registry is ready, we can tag our image and push it to the registry. I recommend following the `Push Commands` provided by the registry. These push commands are a set of Docker commands used to build and push the image.

Two remaining tasks are to create an S3 bucket for streaming logs and to provision a policy for the task role to allow writing to this S3 bucket. We can create the S3 bucket as follows:

```terraform
resource "aws_s3_bucket" "fluentbit_logging_bucket" {
  bucket = "fluent-bit-log-12345"
}

resource "aws_s3_bucket_acl" "fluentbit_logging_bucket_acl" {
  bucket = aws_s3_bucket.fluentbit_logging_bucket.id
  acl    = "private"
}
```

We could provision the following policy and attach it to the task role:

```terraform
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

## Conclusion

In this article, we explored how to configure Fluent Bit agents for ECS Fargate tasks. We also learned how to deploy Fluent Bit as a sidecar container, separating it from the execution of the main service. The key advantage of using Fluent Bit is its extensive collection of plugins and out-of-the-box solutions, enabling seamless integration with virtually any existing log aggregator.

The code for this project with instructions to deploy everything can be found on GitHub: [https://github.com/Ernyoke/aws-fargate-fluentbit](https://github.com/Ernyoke/aws-fargate-fluentbit)

## References

[^1]: Fluent Bit Output Plugins: [Fluentbit docs](https://docs.fluentbit.io/manual/pipeline/outputs)
[^2]: Send Amazon ECS logs to an AWS service or AWS Partner: [AWS docs](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/using_firelens.html)
[^3]: Example of task definitions with Fluent Bit form AWS documentation: [AWS docs](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/firelens-taskdef.html)