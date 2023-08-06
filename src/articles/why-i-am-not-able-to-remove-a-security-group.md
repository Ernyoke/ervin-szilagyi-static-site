# Why I Am Not Able to Remove a Security Group?

If you have a slightly more extended experience with IaC, more specifically with Terraform, you might have run into the following:

![Terraform Remove Security Group Attached to a Lambda](why-i-am-not-able-to-remove-a-security-group/tf.gif)

This usually happens when we are trying to remove a Lambda Function placed in a VPC. The reason for this is that the removal of the Security Group is temporarily blocked by one ore more network interface. 

In the upcoming lines we will see how can we handle these cases when our Security Group is unable to be removed. We will discuss why is the case for this blockages and what can we do to overcome these.

## Why does a Security Group becomes unable to be removed?

A Security Group is a [stateful firewall](https://en.wikipedia.org/wiki/Stateful_firewall), the purpose of which is to control what kind of inbound and outbound traffic can be allowed for a resource in a VPC. A Security Group is always assigned to an ENI ([Elastic network interface](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-eni.html)). This is true, even if the AWS Consol makes it seem like we assign Security Groups to all kind of resources such as EC2 instances, load balancers, Lambda Functions, databases, etc. What is happening in the background is that one or more ENIs will be placed inside our VPC to whom the Security Group will be assigned. The ENIs will be used by our resource, hence the AWS Consol will show it like the Security Group is assigned to resource itself.

A Security Group will be unable to removed in the following cases:

- It is assigned to one or more ENIs: a Security Group can be assigned to one or more ENIs, moreover an ENI can have [up to 5](https://docs.aws.amazon.com/vpc/latest/userguide/amazon-vpc-limits.html#vpc-limits-security-groups) Security Groups assigned to it (soft limit, by asking the AWS Support we can increase this limit to 16). If a Security Group is attached to at least one ENI, we need to either get rid of the ENI or try to de-assign the Security Group from it in order for the SG to be able to be removed.
- It is references by a Security Group Rule: a Security Group can allow inbound/outbound traffic based in rules. We can use another SG as the source/destination for a rule. If an SG is referenced by a rule from another SG, it can not be removed until the rule is removed/changed.
- The SG is a default SG in a VPC: each VPC automatically gets a Security Group when it is created. We can get rid of this Security Group only if we remove the VPC.
- We do not have the privileges to remove the SG: this can happen if the role we are using does not have the necessary permission to do `DeleteSecurityGroup` action.

## The Security Group is Assigned to an ENI

In case we assign a security group to an AWS resource (EC2, Lambda, RDS database, VPC Endpoint, etc.) the security group will always be assigned to a Network Interface (ENI). The AWS Console is somewhat misleading, because it displays that the security group is assigned to the resource itself, but this is not the case. Since all of this ENI provisioning and SG assignment happens in the background, in most of the cases we are not allowed to temper with the ENI and the security group assignment. Sometimes it can be confusing what is actually happening under the hood when we do the resource provisioning, so let's see a few examples to understand what is AWS doing:

- **EC2 instances**: whe we provision an EC2 instance, this will automatically receive a default ENI. This ENI cannot be detached form the instance, hence it cannot be removed. AWS expects from us to assign a security group the the instance at the time of creation. If we want to remove this security group, we have to assign another sg to the EC2 instance. We can do this by either going to the ENI console and assigning a security group straight to the ENI, or by going to the EC2 instance and changing the security group in the Security Settings.

EC2 instances can have also secondary ENIs attached to them. This ENIs are provisioned independently, so we can change the Security Group assigned to them from the ENI console.

- **Lambda Functions**: Lambda Functions require a security group in case we want them to have connectivity to a VPC. If we chose it so, AWS will place a ENI in each subnet we specify, the security group will be assigned to each provisioned ENI. We can change the security group freely if we modify the Lambda Function configuration, but we cannot directly temper with the ENIs. If we decide to remove our functions, the ENIs will also be removed automatically. This removal usually happens with a delay of 10-15 minutes, essentially getting stuck temporarily. This can be annoying if we use Terraform IaC for our infrastructure, since it will try to remove the Security Group over and over again (see the GIF from the beginning of the article). If this removal wont happen in time, we can easily end-up with inconsistent Terraform state. 

- **ECS Fargate Tasks**: In case of ECS tasks, each container from the task can have an ENI, depending the network settings. These ENIs are managed by AWS and we cannot really temper with them. We can change the security groups on the task settings. When the containers are decommissioned if we decide to remove our task, the ENIs will be automatically removed. Most of the cases this happens instantly, but in very rare instances we can manage to end-up with a stuck ENI. In this case we can attempt to remove the ENI. If this is unsuccessful, we have to write to AWS Support.

- **VPC Endpoints**: VPC Endpoints are used have multiple benefits for our infrastructure. We can have endpoints for reaching AWS services such as S3, DynamoDB, etc. without the need to have outgoing connectivity to the public internet, or we can have one-to-one connectivity to any instance from a totally different VPC. The restriction is that PrivateLink, the service which powers VPC Endpoints, works at availability zone level, this means our connecting subnet has to be in the same AZ as the other subnet who is exposing the resource. In terms of ENIs and security groups, the idea is the same as with other resources. We get an ENI in each subnet we in which we place an endpoint. This ENI is managed by AWS. We can modify the security groups if we go to the VPC Endpoint settings. The ENI will be removed and security group will be detached automatically if we get rid of the endpoint.

At this point we can get any other AWS resource, we most likely we have similar networking setup with ENI placement and security group assignment to the ENI. What is important to know are the following:

- Security Groups are assigned to Network Interfaces. In most of the cases, an ENI cannot exist without a security group
- In most of the cases, ENIs are placed inside our VPC while we provision a resource. At the time of provisioning we have to assign a security group to the ENI
- Usually we cannot temper with the ENI, meaning we cannot directly de-associate the security group from it. We can change the security group if we modify the AWS service which is using the ENI
- If we want to remove a security group we have to either:
    - remove the AWS service which is using the ENI to which our security group is assigned
    - modify the service which is using the ENI, hence the security group, by assigning another security group to it and removing the one which we would like to remove

## References:

1. [Security groups Limits](https://docs.aws.amazon.com/vpc/latest/userguide/amazon-vpc-limits.html#vpc-limits-security-groups)

