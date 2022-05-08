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

Building a base VPC with 2 subnets (a public and a private subnet), an Internet Gateway and a NAT Gateway:

```Bash
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

# Configure the AWS Provider
provider "aws" {
  region = "us-east-1"
}

# Create a VPC
resource "aws_vpc" "fluent_bit_vpc" {
  cidr_block = "10.0.0.0/16"

  tags = {
    "Name" = "Fluent Bit VPC"
  }
}

# Create a public subnet
resource "aws_subnet" "fluent_bit_public_subnet" {
  vpc_id     = aws_vpc.fluent_bit_vpc.id
  cidr_block = "10.0.1.0/24"

  tags = {
    Name = "Fluent Bit Public Subnet"
  }
}

# Create a private subnet
resource "aws_subnet" "fluent_bit_private_subnet" {
  vpc_id     = aws_vpc.fluent_bit_vpc.id
  cidr_block = "10.0.2.0/24"

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
  subnet_id     = aws_subnet.fluent_bit_public_subnet.id

  tags = {
    Name = "Fluent Bit NAT Gateway"
  }

  # To ensure proper ordering, it is recommended to add an explicit dependency
  # on the Internet Gateway for the VPC.
  depends_on = [aws_internet_gateway.fluent_bit_igw]
}

# Public IP for the NAT gateway
resource "aws_eip" "fluent_bit_ngw_eip" {
}

# Route traffic from the public subnet to the internet gateway
resource "aws_route_table" "fluent_bit_public_rt" {
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
  subnet_id      = aws_subnet.fluent_bit_public_subnet.id
  route_table_id = aws_route_table.fluent_bit_public_rt.id
}

# Route traffic from the private subnet to the NAT gateway
resource "aws_route_table" "fluent_bit_private_rt" {
  vpc_id = aws_vpc.fluent_bit_vpc.id

  route {
    cidr_block = "10.0.2.0/24"
    gateway_id = aws_nat_gateway.fluent_bit_ngw.id
  }

  tags = {
    Name = "Fluent Bit Private Subnet Route Table"
  }
}

resource "aws_route_table_association" "fluent_bit_private_rta" {
  subnet_id      = aws_subnet.fluent_bit_private_subnet.id
  route_table_id = aws_route_table.fluent_bit_private_rt.id
}
```