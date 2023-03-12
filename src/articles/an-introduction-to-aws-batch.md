# An Introduction to AWS Batch

[AWS Batch](https://docs.aws.amazon.com/batch/latest/userguide/what-is-batch.html) is a fully managed service that helps us developers run batch computing workloads on the cloud. The goal of this service is to effectively provision infrastructure for batch jobs submitted by us, while letting developers focus on writing the code and dealing with business constraints.

Batch jobs are essentially Docker containers that can be run on different environments. AWS Batch supports job queues that are deployed on EC2 instances, on ECS clusters with Fargate and on Amazon EKS (Elastic Kubernetes Service). Regardless of what we choose for the basis of our infrastructure, the provisioning of the necessary services and orchestration of the running jobs is managed by AWS.

## Components of AWS Batch

Although, one of the selling point of AWS Batch is to simplify batch computing on the cloud, it has a bunch of components and moving parts. The main components of AWS Batch service are the following:

### Jobs

Jobs are Docker containers wrapping units of work which we submit to AWS Batch queue. Jobs can have names and they can receive parameters from their job definition.

### Job Definitions

A job definition specifies how a job should run. Jobs definitions can have the followings:

- an IAM role to provide access to other AWS services;
- information about the memory and CPU requirements of the job;
- other properties for required for job such as environment variables, container properties and mount points for extra storage.

### Job Queues

Jobs are submitted to job queues. The role a a job queue is to schedule jobs and run them on compute environments. Jobs can have a priority and based on this priority they can be scheduled on different compute environments. The job queue itself can decide which job to run first on which compute environment.

### Compute Environments

Compute environments are essentially ECS clusters. They contain the Amazon ECS container instances used to run the containerized batch jobs. They can have managed or unmanaged compute environments:

- **Managed compute environments**: AWS batch decides the capacity and the EC2 instance type required for the job, in case we decide to run our jobs on EC2. Alternatively, we can use Fargate, which will run our containerized batch job on an instances entirely hidden from us and managed by AWS.
- **Unmanaged compute environments**: we manage our own compute resources. It requires that our compute environments uses an AMI that meets the AWS ECS required AMI specifications.

## Multi-node jobs and GPU jobs

AWS Batch supports multi-node parallel jobs that span an multiple EC2 instances. They can be used for parallel data processing, high-performance computing applications and for training of machine learning models. Multi-node jobs can run only on managed compute environments.

Additionally to multi-node jobs, we can enhance the underlying EC2 instances with graphics cards (GPUs). This can be useful for operations relying on parallel processing, such as deep learning.

## AWS Batch - When to use it?

AWS Batch is recommended for any task which requires a lot of time/memory/computing power to run. This is very vague statement, so let's see some examples of use-cases for AWS Batch:
    
- High performance computing: task which require a lot of compute power such as running usage analytics task on a huge amount of data, automatic content rendering, transcoding, etc.
- Machine Learning: as we've seen before AWS Batch supports multi-node jobs and GPU powered jobs, which can be essential for training ML models
- ETL: we can use AWS Batch for ETL (extract, transform and load) tasks
- For any other task which may take up a lot of time (hours/days)

While these use-cases may sound cool, I suggest to have caution before deciding if AWS Batch is the right choice for us. AWS offers a bunch of other products configured for specialized use cases. Let's walk through few of these:

### AWS Batch vs AWS Glue/Amazon EMR

Before I mentioned that AWS Batch can be used for ETL jobs. While this is true, we may want to step back and take a look another services, such as AWS Glue. AWS Glue is a managed service developed specifically for ETL jobs. It is a serverless option offering a bunch of options for data preparation, data integration and ingestion into several other services. It relies on Apache Spark.

Similarly, Amazon EMR is also an ETL solution for petabyte-scale data processing relying on open source frameworks, such as Apache Spark, Apache Hive and Presto.

My recommendation would be to use Glue/EMR if we are comfortable with the technologies they rely on. If we want to have something custom, built by ourselves, we can stick to AWS Batch.

### AWS Batch vs SageMaker

We've also seen that AWS Batch can be used for machine learning. Again, while this is true, it is a really crude way of doing machine learning. AWS offers SageMaker for Machine Learning a data science. SageMaker can also run jobs can be enhanced by GPU computing power.

While SageMaker is a one-stop shop for everything related to machine learning, AWS Batch is an just an offering for executing long running jobs. If we have a machine learning model implemented but we just need the compute power to do the training, we can use AWS Batch, other than this probably SageMaker would make way much sense for everything ML-related.

### AWS Batch vs AWS Lambda

AWS Lambda can also be an alternative for AWS Batch jobs. For certain generic tasks for which we might want to consider a batch job, we may find out that a properly configured Lambda function would be able to accomplish them just fine. We can use Lambda Functions when:

- the task is not that compute intensive: AWS Lambda can have up to 6 vCPU cores and up to 10GB or RAM;
- taking in consideration these hardware resources, we know that our task would be able to be finished in 15 minutes.

If we can acomodate to these Lambda limitations, I strongly suggest using Lambda instead of AWS Batch. Lambda is considerable easier to be set up and it has way less moving parts. We can simply focus on coding.



## References

1. [AWS Batch Documentation](https://docs.aws.amazon.com/batch/latest/userguide/what-is-batch.html)