# Building Super Slim Containerized Lambdas on AWS

## Motivation

AWS Lambda functions should be fast, slim and they should do one thing. At least this is how I think about them. While I was working on my previous [article](running-serverless-lambdas-with-rust-aws.md), I noticed that the after a Lambda container is built, it gets thicker than one would expect. For example, the base image used to run the Rust Lambda executable, `public.ecr.aws/lambda/provided:al2` has the size of 309 MB. This gets even worse with an image built provided for running JavaScript code. Currently, the latest `public.ecr.aws/lambda/nodejs` has 485 MB. The size increase can be attributed to the NodeJS runtime which can be over 150 MB. But still, in my opinion it just feels wrong to deploy such monstrosities in order to run a few lines of code.

My goal is to bring the size of a containerized Lambda down as much as I can. Obviously there are a few limitations and gotchas in order to accomplish this. Certainly, we cannot have a thinner Lambda than our code size/built executable. Moreover, we cannot have a container with 0 additional overhead. But we can have something really thin. 

Coming back to my initial idea that Lambda functions should be slim, if we want to have the slimmest Lambda, we should not use Docker at all. We should just package and upload our code or our executable to AWS and we are good. By default, the inner working of a Lambda environment is hidden for us, although, most like the same base image is used in this case as well.

## Distroless Containers

Hunting for the slimmest possible container image, we will most likely run into a variant of an alpine based image. The base alpine image has around 5 MB, which is pretty small, but we can have even a smaller option. Enter "Distroless" containers.

[Distroless containers](https://github.com/GoogleContainerTools/distroless) were first introduces by Google, according to them:

> "Distroless" images contain only your application and its runtime dependencies. They do not contain package managers, shells or any other programs you would expect to find in a standard Linux distribution.

For more info, we could watch these presentation about the topic: [talk](https://youtu.be/lviLZFciDv4)

## Build a Distroless Image

For my previous a[article](running-serverless-lambdas-with-rust-aws.md) I built a Lambda function in Rust for testing and benchmarks. This application would be a perfect choice of being deployed on a Distroless in Distroless environment. The container we are planning to use to deploy this executable, is `gcr.io/distroless/static`. The container has around 2.4 MB uncompressed. It was specifically created for statically compiled applications, which is exactly what we are looking for.

In the following lines we will define a Dockerfile to use distrloless with a Rust Lambda executable. This Dockerfile will be a multistage definition, the first stage will be doing the compilation and building of the application, while the second stage will be the one deployed on AWS.

The Dockerfile for an `x86-64` Lambda would look something like this:

```bash
ARG FUNCTION_DIR="/function"

FROM rust:1.63-buster as builder

RUN apt-get update && apt-get install jq libssl-dev gcc zip -y
RUN rustup target add x86_64-unknown-linux-musl

WORKDIR /build

# Copy the source code of the whole project to the Docker image
ADD . . 

RUN cargo build --release --target x86_64-unknown-linux-musl

# Copy artifacts to a clean image
FROM gcr.io/distroless/static

# Include global arg in this stage of the build
ARG FUNCTION_DIR

# Set working directory to function root directory
WORKDIR ${FUNCTION_DIR}

COPY --from=builder /build/target/x86_64-unknown-linux-musl/release/bootstrap bootstrap

ENTRYPOINT [ "./bootstrap" ]
```

With slight adjustments we can create a `arm64` Docker image:

```bash
ARG FUNCTION_DIR="/function"

FROM rust:1.63-buster as builder

RUN apt-get update && apt-get install jq libssl-dev gcc zip -y
RUN rustup target add aarch64-unknown-linux-musl

WORKDIR /build

# Copy the source code of the whole project to the Docker image
ADD . .

RUN cargo build --release --target aarch64-unknown-linux-musl

# Copy artifacts to a clean image
FROM gcr.io/distroless/static:latest

# Include global arg in this stage of the build
ARG FUNCTION_DIR

# Set working directory to function root directory
WORKDIR ${FUNCTION_DIR}

COPY --from=builder /build/target/aarch64-unknown-linux-musl/release/bootstrap bootstrap

ENTRYPOINT [ "./bootstrap" ]
```

Both of these images can be built with `docker buildx` command:

```bash
docker buildx build --progress=plain --platform linux/arm64 -t rust-arm64 -f Dockerfile-distroless-x86-64 .
```

Changing the `--platform` argument to `linux/amd64`, we can built ARM based containers as well. We could use the usual `docker build` command, but this will target the systems architecture, which can be `x86-64` for most of the PC/laptop devices abd `arm64` for the ARM based devices such as M1 Macs.


## Links and References

"Distroless" Container Images - [https://github.com/GoogleContainerTools/distroless](https://github.com/GoogleContainerTools/distroless)
