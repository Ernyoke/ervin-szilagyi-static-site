# An Introduction to AWS Batch

[AWS Batch](https://docs.aws.amazon.com/batch/latest/userguide/what-is-batch.html) is a fully managed service that helps us developers run batch computing workloads on the cloud. The goal of this service is to effectively provision infrastructure for batch jobs submitted by us, while letting developers focus on writing the code and dealing with business constraints.

Batch jobs are essentially Docker containers that can be run on different environments. AWS Batch supports job queues that are deployed on EC2 instances, on ECS clusters with Fargate and on Amazon EKS (Elastic Kubernetes Service). Regardless of what we choose for the basis of our infrastructure, the provisioning of the necessary services and orchestration of the running jobs is managed by AWS.

## Components of AWS Batch

Although, one of the selling point of AWS Batch is to simplify batch computing on the cloud, it has a bunch of components and moving parts. The main components of AWS Batch service are the following:

### Jobs

Jobs are Docker containers encompassing units of work which we submit to AWS Batch service. Jobs can have names and they can receive parameters in their definitions.

### Job Definitions

A job definition specifies how a job should run. Jobs definitions can have an IAM role to provide access to other AWS services. They contain the information for memory and CPU requirements of the job. Besides the hardware requirements, we can also specify properties for a job such as environment variables, container properties and mount points for extra storage.

### Job Queues

### Compute Environments


## References

1. [AWS Batch Documentation](https://docs.aws.amazon.com/batch/latest/userguide/what-is-batch.html)