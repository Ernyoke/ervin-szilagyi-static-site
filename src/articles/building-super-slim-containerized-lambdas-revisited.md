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

On the other hand, I’m really excited to dive into the nifty details of building tiny images—so without further ado, let’s get started!