# Deploy Containers with App Runner

> AWS App Runner is a fully managed service that makes it easy for developers to quickly deploy containerized web applications and APIs, at scale and with no prior infrastructure experience required.

This is how AWS markets App Runner service on their [official page](https://aws.amazon.com/apprunner/). The focus should be in easiness and quickness on this description. The reality is that containers can be misleadingly complex, deploying them to cloud services can be even more daunting. Before App Runner, AWS provided a few ways for us to be able to run containers: we had Elastic Container Service (ECS) - which is AWS's own implementation of a container orchestrator, we had Elastic Kubernetes Service (EKS) - Kubernetes cluster as a service provided by AWS, and last but not least we had Elastic Beanstalk - which attempted to be a simplification layer over ECS. 

While these options do work well, as intended, for running containers on the AWS cloud, they are not simple and easy to use services. Even if take a look at Elastic Beanstalk, we can notice that it offers lots and lots of configurations. Elastic Beanstalk by itself is a CloudFormation template, managed by AWS, which is executed anytime we provision a new environment. This template will provision several resources on the backend, which ultimately have to be managed by us. We might be OK with that, but if we are not, than we could take a look at App Runner.

## References:

1. AWS App Runner: [https://aws.amazon.com/apprunner/](https://aws.amazon.com/apprunner/)