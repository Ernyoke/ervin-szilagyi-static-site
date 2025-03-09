# Building Super Slim Containerized Lambdas on AWS - Revisited

## Introduction

Recently, I was reading through some AWS blogs when I stumbled upon this article, [Optimize your container workloads for sustainability](https://aws.amazon.com/blogs/containers/optimize-your-container-workloads-for-sustainability/). Among other topics, the article discusses reducing the size of your Lambda container images to achieve better sustainability. One of the main points discussed is how to reduce the size of Lambda containers—the idea being that smaller containers require less bandwidth to transfer over the internet, take up less storage on disk, and are usually faster to build, thereby consuming less energy.

At first glance, this might seem like a minor optimization, but when you consider that AWS has millions of customers building Docker images, it suddenly makes sense to recommend working with slimmer images. Furthermore, having smaller images is consider a best practice overall.

Around three years ago, I wrote an article about ways to reduce the size of Lambda containers, titled (Building Super Slim Containerized Lambdas on AWS)[/articles/building-super-slim-containerized-lambdas.html]. The article primarily focuses on Lambda functions written in Rust. Reading the AWS blog article reminded me that I should probably revisit the topic of creating slim Lambda images and provide a more informed perspective.

## Short Recap

In my old article, titled [Optimize your container workloads for sustainability](https://aws.amazon.com/blogs/containers/optimize-your-container-workloads-for-sustainability/) I used Rust to build a Lambda function. Code written in Rust is compiled into a binary. To execute this binary as a Lambda function, you can either upload the binary directly to AWS Lambda or package it in a Docker image, upload the image to ECR, and configure Lambda to use that image.

The size of this Docker image can vary significantly. If you use the default image recommended by AWS (`public.ecr.aws/lambda/provided`), the container size can be a few hundred megabytes. However, if you go with a minimal approach, such as a Distroless image, you can get containers down to just a few dozen megabytes, depending mostly on the size of the compiled binary.

When it comes to Lambda execution time, image size has little impact. Whether the image is large or small, the function's execution time remains roughly the same - though I haven’t tested exceptionally large images that might push Lambda’s limits.

Ultimately, the takeaway from the article was that while Distroless allows you to build smaller images, it might not be all that beneficial since it doesn’t improve performance. I also pointed out that a smaller image can speed up the build pipeline. Admittedly, at that time, I didn’t even consider the sustainability angle. Even after all these years, I can only speculate about its impact. As a solo AWS user, it’s difficult to quantify how much of a difference using smaller images would actually make.

On the other hand, I’m really excited to dive into the nifty details of building tiny images - so without further ado, let’s get started!

## Steps to Build a Slim Container

In order to build slim containers, we would want to leverage the following steps:

### 1. Use tiny base images

Probably the most important step in reducing the image size. That is because in most of cases with this step we can reduce the image size the most, without touching our application's source code.

The general idea is that instead of base images such as `public.ecr.aws/lambda/provided:al2` (the image recommended by AWS for compiles executables such as ones developed in Rust) or images based on Ubuntu we can use images such as Alpine, Distroless or Chainguard (images based on Wolfi Linux). These images contain only what is needed to run our Lambda function. Images such as Distroless or Chainguard are effectively slimmed down to what is exactly needed for an executable to run. They don't contain a shell or an package manager, most of the usual Linux binaries are also removed. The result of this is that these images are really small.

The downside of using these small images is that they can be challenging to work with them while developing or having to debug something. For example, we cannot straight ahead open a shell in a Distroless image, since there is no shell installed.

> [!NOTE]
> To start a shell inside a Distroless image, you can rebuild your image using the `:debug` tag. For example, instead of `FROM gcr.io/distroless/cc:latest-amd64` you can have `FROM gcr.io/distroless/cc:debug`. "Debug" images come with busybox which is a small container for your usual Linux binaries.

> [!NOTE]
> Similarly, with Chainguard images, you can append the `-dev` keyword to the tag of the image. For example, if we have an image built on `FROM cgr.dev/chainguard/static:latest`, we can rebuild it with `FROM cgr.dev/chainguard/static:latest-dev` to have access to a shell and other debug tools.

### 2. Add strictly what you need to the image

This point is similar to the previous one, the difference being that even if you choose the smallest base image possible, you might found yourself having a bunch of unnecessary stuff added back to your image at build time. To avoid this, you can do the following:

1. Use [multistage builds](https://docs.docker.com/build/building/multi-stage/): most probably your application gets built together with the docker image you publish. In many instances what people actually do is to copy over the source code the the image and after that execute the commands to create the application package. The outcome of this process is that the resulting image may contain a lot "development" dependencies, which are not need for the final package to run. You can either remove this manually, or just simply use multistage builds. In case of multistage builds, you can use different images for build and execution. In fact, you can use a fully fledged development image for the build step, after which you copy the artifacts to a stripped down image used for execution.

1. Use `.dockerignore` to copy only what you need to your image: similarly to `.gitignore`, .`dockerignore` let's you specifies files and folders which you should not copy over to your images at build time.