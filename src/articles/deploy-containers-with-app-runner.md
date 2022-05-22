# Deploy Containers with App Runner

> AWS App Runner is a fully managed service that makes it easy for developers to quickly deploy containerized web applications and APIs, at scale and with no prior infrastructure experience required.

This is how AWS markets App Runner service on their [official page](https://aws.amazon.com/apprunner/). The focus should be on easiness and quickness on this description. The reality is that containers can be misleadingly complex, deploying them to cloud services can be even more daunting. Before App Runner, AWS provided a few ways for us to be able to run containers: we had Elastic Container Service (ECS) - which is AWS's own implementation of a container orchestrator, we had Elastic Kubernetes Service (EKS) - Kubernetes cluster as a service provided by AWS, and last but not least we had Elastic Beanstalk - which attempted to be a simplification layer over ECS. 

While these options do work well, as intended, for running containers on the AWS cloud, they are not simple and easy to use services. Even if we take a look at Elastic Beanstalk, we can notice that it offers lots and lots of configurations. Elastic Beanstalk by itself is a CloudFormation template, managed by AWS, which is executed anytime we create a new environment. This template will provision several resources on the backend, which ultimately have to be managed by us. We might be OK with that, but if we are not, then we could take a look at App Runner.

## Deploy Application straight from GitHub

In order to deploy containers in App Runner, we can either build our Docker container ourselves and push it into an Elastic Container Registry repository, or we can let App Runnier build the container for us by pulling our code from GitHub building our application automatically.

While App Runner is smart enough to build our application, to be able to do it correctly, we should place an `apprunner.yaml` configuration file in the root of our repository. This config file should contain information about how to build the application, which runtime environment to use and additional configuration for deployment of the application.

An example for an `apprunner.yaml` configuration file for [NestJS](https://nestjs.com/) could be the following:

```yaml
version: 1.0
runtime: nodejs14

build:
  commands:
    pre-build:
      - echo "Deployment started..."
    build:
      - npm ci
      - npm run build
    post-build:
      - echo "Deployment finished successfully!"

run:
  runtime-version: 14.19.0
  command: npm run start:prod
  network:
    port: 3000
  env:
    - name: MY_VAR
      value: my_var
```

The whole project can be found on GitHub: [https://github.com/Ernyoke/aws-apprunner-nest-example](https://github.com/Ernyoke/aws-apprunner-nest-example).

The steps of deploying this application to App Runner straight from GitHub, are the following:

1. From our AWS console, in our region of choice, we should go to the App Runner page and press the **Create an App Runner service** button. We will be greeted with a form having 3 steps. In the first step we have to specify wether we are trying to deploy our application from an Elastic Container Repository (ECR) or from GitHub source. In our case, we should select **Source Code Repository**. If this is our first deployment on App Runner, we will have to connect our AWS account to our GitHub account and we should give access to the repository we would want to deploy. After we've done that, we can select the git branch we want to deploy.

## References:

1. AWS App Runner: [https://aws.amazon.com/apprunner/](https://aws.amazon.com/apprunner/)
2. GitHub - aws-apprunner-nest-example project: [https://github.com/Ernyoke/aws-apprunner-nest-example](https://github.com/Ernyoke/aws-apprunner-nest-example)