# ECS Fargate Custom Logging with Fluent Bit

## Motivation

AWS Elastic Container Registry provides an easy way of managing logs for containers and our micro-services running inside those containers. Having seamless integration with CloudWatch Logs, containers deployed on ECS Fargate have their standard output piped to CloudWatch Logs. This is made possible by `awslogs` log driver, which runs outside of the container and it is fully managed by AWS.

Using `awslogs` with CloudWatch may be fine for most of the use cases, although we might have several reasons for using a third party log aggregated.

For example:

- we may want to use a company-wide log aggregator based on ELK stack (or insert other log aggregator here);
- we may want to have better searching and traceability compared to what CloudWatch Log Insights offers;
- we may want to avoid high ingestion price offered by CloudWatch Logs. This might not be as obvious at first, having a huge cluster of microservices with steady log flow may drive the monthly costs up significantly

## Introduction to FluentBit

At this point we might have taken the decision to store our logs outside of CloudWatch, the next challenge we are facing is how to stream our logs to our aggregator. One option would be to use a log router named [Fluent Bit](https://docs.fluentbit.io/manual). Fluent Bit is a lightweight agent with the sole purpose of gathering log messages from our containers and stream them into a log aggregator. Fluent Bit [plugins](https://docs.fluentbit.io/manual/pipeline/outputs) for integrating with essentially all known log aggregators. Moreover, it can collect logs from several sources in several formats, it can transform this messages offering a seamless integration between a produces service and a consumer (which can be even CloudWatch).

Fluent Bit is also fully supported by AWS. For custom log driver setup ECS offers the [`FireLens`](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/using_firelens.html) log driver. AWS also offers a custom Docker image for Fluent Bit, which will be used further on in this article.

## Base Infrastructure Setup

What we would want to achieve is to deploy a Fargate cluster with an nginx container using Fluent Bit. For being able to do this, we might want to lay down some basic infrastructure first. We need a VPC with a few subnets which do have access to internet. We will use Terraform in this article to easily spin up this infrastructure and also to provide a blueprint for the reader which can be easily reproducible. This article wont go into the inner workings of Terraform and expects the reader to have basic familiarity with its deployment process (or with any kind IoC deployment tool working process).

Let's build a base VPC with 4 subnets (2 public and 2 private subnet), an Internet Gateway and a NAT Gateway:

```Bash
# Create a VPC
resource "aws_vpc" "fluent_bit_vpc" {
  cidr_block = "10.0.0.0/16"

  tags = {
    "Name" = "Fluent Bit VPC"
  }
}

# Create a public subnet
resource "aws_subnet" "fluent_bit_public_subnet" {
  count             = 2
  availability_zone = element(data.aws_availability_zones.azs.names, count.index)
  vpc_id            = aws_vpc.fluent_bit_vpc.id
  cidr_block        = cidrsubnet("10.0.0.0/16", 8, count.index)

  tags = {
    Name = "Fluent Bit Public Subnet"
  }
}

# Create a private subnet
resource "aws_subnet" "fluent_bit_private_subnet" {
  count             = 2
  availability_zone = element(data.aws_availability_zones.azs.names, count.index)
  vpc_id            = aws_vpc.fluent_bit_vpc.id
  cidr_block        = cidrsubnet("10.0.0.0/16", 8, length(aws_subnet.fluent_bit_public_subnet[*]) + count.index)

  tags = {
    Name = "Fluent Bit Private Subnet"
  }
}

# Create an internet gateway for the VPC
resource "aws_internet_gateway" "fluent_bit_igw" {
  vpc_id = aws_vpc.fluent_bit_vpc.id

  tags = {
    Name = "Fluent Bit Internet Gateway"
  }
}

# Create a NAT gateway for the private subnet and place it into the public subnet
resource "aws_nat_gateway" "fluent_bit_ngw" {
  allocation_id = aws_eip.fluent_bit_ngw_eip.allocation_id
  subnet_id     = aws_subnet.fluent_bit_public_subnet[0].id

  tags = {
    Name = "Fluent Bit NAT Gateway"
  }

  # To ensure proper ordering, it is recommended to add an explicit dependency
  # on the Internet Gateway for the VPC.
  depends_on = [aws_internet_gateway.fluent_bit_igw]
}

# Public IP for the NAT gateway
resource "aws_eip" "fluent_bit_ngw_eip" {
  tags = {
    "Name" = "Fluent Bit NAT Gateway IP"
  }
}

# Route traffic from the public subnet to the internet gateway
resource "aws_route_table" "fluent_bit_public_rt" {
  count  = 2
  vpc_id = aws_vpc.fluent_bit_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.fluent_bit_igw.id
  }

  tags = {
    Name = "Fluent Bit Public Subnet Route Table"
  }
}

resource "aws_route_table_association" "fluent_bit_public_rta" {
  count          = 2
  subnet_id      = aws_subnet.fluent_bit_public_subnet[count.index].id
  route_table_id = aws_route_table.fluent_bit_public_rt[count.index].id
}

# Route traffic from the private subnet to the NAT gateway
resource "aws_route_table" "fluent_bit_private_rt" {
  count  = 2
  vpc_id = aws_vpc.fluent_bit_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_nat_gateway.fluent_bit_ngw.id
  }

  tags = {
    Name = "Fluent Bit Private Subnet Route Table"
  }
}

resource "aws_route_table_association" "fluent_bit_private_rta" {
  count          = 2
  subnet_id      = aws_subnet.fluent_bit_private_subnet[count.index].id
  route_table_id = aws_route_table.fluent_bit_private_rt[count.index].id
}
```

Now that we have a VPC, we need an Application Load Balancer for our ECS cluster. ECS services will be automatically registered to this load balancer. Also, we would want to allow traffic from this load balancer only to the ECS tasks.

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

Provisioning the ECS cluster:

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

In order to deploy a container to, we need to create a ECS task. Each task has task definition, which contains all the properties needed for the container to run, including the location of the image. ECS also supports [sidecar container pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/sidecar), which would be a outstanding solution for having separation of concerns between the primary container and peripheral task such as log routing.

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

The task definition requires an execution role. This role is assumed by ECS service and it is used while deploying and setting up the container. The task definition can also have an task role. This role is attached to the containers and it provides permission for the running containers themselves. For simplicity, we will use the same role for the task and for the execution roles.

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




## References

1. Fluent Bit Manual: [https://docs.fluentbit.io/manual](https://docs.fluentbit.io/manual)
2. Fluent Bit Output Plugins: [https://docs.fluentbit.io/manual/pipeline/outputs](https://docs.fluentbit.io/manual/pipeline/outputs)
3. Custom log routing: [https://docs.aws.amazon.com/AmazonECS/latest/developerguide/using_firelens.html](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/using_firelens.html)
4. Sidecar pattern: [https://docs.microsoft.com/en-us/azure/architecture/patterns/sidecar](https://docs.microsoft.com/en-us/azure/architecture/patterns/sidecar)
5. Example of task definitions for Fluent Bit: [https://docs.aws.amazon.com/AmazonECS/latest/userguide/firelens-example-taskdefs.html](https://docs.aws.amazon.com/AmazonECS/latest/userguide/firelens-example-taskdefs.html)