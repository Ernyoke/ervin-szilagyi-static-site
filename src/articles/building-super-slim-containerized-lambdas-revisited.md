# Building Super Slim Containerized Lambdas on AWS - Revisited

## Introduction

Recently, I was reading through some AWS blogs when I stumbled upon this article, [Optimize your container workloads for sustainability](https://aws.amazon.com/blogs/containers/optimize-your-container-workloads-for-sustainability/). Among other topics, the article discusses reducing the size of your Lambda container images to achieve better sustainability. One of the main points discussed is how to reduce the size of Lambda containers—the idea being that smaller containers require less bandwidth to transfer over the internet, take up less storage on disk, and are usually faster to build, thereby consuming less energy.

At first glance, this might seem like a minor optimization, but when you consider that AWS has millions of customers building Docker images, it suddenly makes sense to recommend working with slimmer images. Furthermore, having smaller images is consider a best practice overall.

Around three years ago, I wrote an article about ways to reduce the size of Lambda containers, titled (Building Super Slim Containerized Lambdas on AWS)[/articles/building-super-slim-containerized-lambdas.html]. The article primarily focuses on Lambda functions written in Rust. Reading the AWS blog article reminded me that I should probably revisit the topic of creating slim Lambda images and provide a more informed perspective.

## Short Recap

In my old article, titled [Building Super Slim Containerized Lambdas on AWS]('building-super-slim-containerized-lambdas.md') I used Rust to build a Lambda function. Code written in Rust is compiled into a binary. To execute this binary as a Lambda function, you can either upload the binary directly to AWS Lambda or package it in a Docker image, upload the image to ECR, and configure Lambda to use that image.

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

> **ℹ️ Note**:
> To start a shell inside a Distroless image, you can rebuild your image using the `:debug` tag. For example, instead of `FROM gcr.io/distroless/cc:latest-amd64` you can have `FROM gcr.io/distroless/cc:debug`. "Debug" images come with busybox which is a small container for your usual Linux binaries.
#
> **ℹ️ Note**:
> Similarly, with Chainguard images, you can append the `-dev` keyword to the tag of the image. For example, if we have an image built on `FROM cgr.dev/chainguard/static:latest`, we can rebuild it with `FROM cgr.dev/chainguard/static:latest-dev` to have access to a shell and other debug tools.

### 2. Add strictly what you need to the image

This point is similar to the previous one, the difference being that even if you choose the smallest base image possible, you might found yourself having a bunch of unnecessary stuff added back to your image at build time. To avoid this, you can do the following:

1. Use multistage builds[^1]: most probably your application gets built together with the docker image you publish. In many instances what people actually do is to copy over the source code the the image and after that execute the commands to create the application package. The outcome of this process is that the resulting image may contain a lot "development" dependencies, which are not need for the final package to run. You can either remove this manually, or just simply use multistage builds. In case of multistage builds, you can use different images for build and execution. In fact, you can use a fully fledged development image for the build step, after which you copy the artifacts to a stripped down image used for execution.

1. Use `.dockerignore` to copy only what you need to your image: similarly to `.gitignore`, .`dockerignore` let's you specifies files and folders which you should not copy over to your images at build time.

### 3. Use a compiled language to build a small executable

Nowadays, it is becoming increasingly challenging to distinguish between interpreted and compiled languages. Many interpreted (or so-called "scripting") languages use just-in-time (JIT) compilers, meaning the code is compiled to machine code at execution time.

The key takeaway here is that, to optimize the size of our container, we may want to avoid writing our Lambda functions in languages that require an interpreter or JIT compiler. Instead, we should build an executable before creating our final Docker container.

To be more specific, rather than using Python or JavaScript, we might consider Rust, Go, or C++. Of course, I fully understand that this may not always be feasible, and my intention is not to discredit Python, JavaScript, or any other language. However, it is important to recognize that if we prioritize minimizing container size, eliminating the interpreter can free up tens-if not hundreds—of megabytes.

### 4. Static vs dynamic linking

In case we followed previous points, our image should be really small right now. We are mainly working on reducing the size of the executable we build. One thing we run into at this point is the presence of libc (usually `glibc`) in our image. Both Distroless and Chainguard present the option to chose base image the has `glibc` and an equivalent image that does not have. Obviously, the image that has glibc is larger in size.

`glibc`, or the GNU C Library, is the standard C library (libc) implementation used on Linux systems. It offers a wide range of functions that allow programs to interact with the operating system, such as handling input/output, managing memory, and manipulating strings. Rust, relies on `glibc` for interacting with the operating system. On Linux, this typically means linking against `glibc`, as Rust's standard library, `libstd`, uses it for system calls and other operations. In the other Go offers more flexibility by allowing compilation without relying on the system's C standard library. By setting `CGO_ENABLED=0`, Go programs use their own implementations for system interactions, avoiding `glibc` dependency. This means that if we build al Lambda function with Go, we can just disable linking against `glibc` and we can put our executable in an image that does not have the library. In case of Rust, we can build an executable that statically links libc by using musl[^2][^3].

### 5. Building an image from Scratch

The most slimmed down image that we can have is to use `scratch`[^4] image as base, simply adding our binary executable to it. This can work for AWS Lambda as well, but we may soon run into issues, depending on what our Lambda function needs to do. For example:

- CA (Certificate Authority) certificates will be missing, we wont even have a  `/etc/ssl/certs/` folder. This will cause HTTPS connections to fail. To use any AWS service such as DynamoDB or S3, HTTPS must work.
- Standard directories such as `/var`, `/home`, and `/root` will be missing. The exception is the `/tmp` directory, which will be mounted by AWS, allowing us to write to a temporary folder if needed.
- Time zone data may cause issues, as the `/usr/share/zoneinfo` directory will be missing.

Of course, we can overcome these issues by adding the necessary files and folders at build time, but that defeats the purpose of using the `scratch` base image. Instead, we would rather choose Distroless or Chainguard.

## Build the Slimmest Image Possible for a Rust Lambda

Following these steps let's try to build a slim but usable containerized image for a Lambda function developed in Rust. 

```bash
ARG FUNCTION_DIR="/function"

FROM rust:1.84-bullseye AS builder

WORKDIR /build

ADD Cargo.toml Cargo.toml
ADD Cargo.lock Cargo.lock
ADD src src

# Cache build folders, see: https://stackoverflow.com/a/60590697/7661119
# Docker Buildkit required
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/home/root/app/target \
    rustup target add x86_64-unknown-linux-musl && \
    cargo build --release --target x86_64-unknown-linux-musl

# copy artifacts to a clean image
FROM cgr.dev/chainguard/static:latest

COPY --from=builder /build/target/x86_64-unknown-linux-musl/release/bootstrap bootstrap

ENTRYPOINT [ "./bootstrap" ]
```

The size of this image is 4.03 MB, of which the final base image itself (`chainguard/static`) accounts for approximately 1.33 MB, while the remaining 2.7 MB is the executable. Admittedly, my Lambda function does not do a lot and has only a few dependencies (the code for the function can be found here: [GitHub](https://github.com/Ernyoke/aws-lambda-benchmarks/tree/main/aws-lambda-compute-pi-rs/src)). More importantly, we followed the steps outlined above to achieve this reduced size:

1. WWe use a builder image to compile the executable.
2. We copy only the necessary files from this image-specifically, the executable named `bootstrap`
3. We use `chainguard/static` to run the Lambda function. We could have used Distroless as well, which would result in a slightly larger image size (4.68 MB).
4. We use the `x86_64-unknown-linux-musl` toolchain to build the executable, ensuring that libc is statically linked.

Additionally, we target the `x86_64` architecture. However, with a few modifications, we could build the same image for arm64:

```bash
ARG FUNCTION_DIR="/function"

FROM rust:1.84-bullseye AS builder

WORKDIR /build

ADD Cargo.toml Cargo.toml
ADD Cargo.lock Cargo.lock
ADD src src

# Cache build folders, see: https://stackoverflow.com/a/60590697/7661119
# Docker Buildkit required
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/home/root/app/target \
    rustup target add aarch64-unknown-linux-musl && \
    cargo build --release --target aarch64-unknown-linux-musl

# copy artifacts to a clean image
FROM gcr.io/distroless/static:latest-arm64

COPY --from=builder /build/target/aarch64-unknown-linux-musl/release/bootstrap bootstrap

ENTRYPOINT [ "./bootstrap" ]
```

The size of this image will be roughly the same - I measured 4.06 MB on my computer. There are minor variations in size depending on the target architecture, with `x86_64` typically being a few KB smaller. However, this difference is negligible.

We can still get the image slimmer by using `scratch`:

```bash
ARG FUNCTION_DIR="/function"

FROM rust:1.84-bullseye AS builder

WORKDIR /build

ADD Cargo.toml Cargo.toml
ADD Cargo.lock Cargo.lock
ADD src src

# Cache build folders, see: https://stackoverflow.com/a/60590697/7661119
# Docker Buildkit required
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/home/root/app/target \
    rustup target add x86_64-unknown-linux-musl && \
    cargo build --release --target x86_64-unknown-linux-musl

# copy artifacts to a clean image
FROM scratch

COPY --from=builder /build/target/x86_64-unknown-linux-musl/release/bootstrap bootstrap

ENTRYPOINT [ "./bootstrap" ]
```

In my case, this Lambda function works - it executes successfully and produces the expected output. However, all it does is calculate the value of PI using the Unbounded Spigot Algorithm for the Digits of PI[^5]. It is a "toy" function, serving as proof that `scratch` can work for Lambda functions. Nevertheless, I do not recommend using this base image. The size of this image is 2.69 MB.


References:

[^1]: [Multistage Builds](https://docs.docker.com/build/building/multi-stage/).
[^2]: [Rust - Static Linking](https://doc.rust-lang.org/1.15.0/book/advanced-linking.html#static-linking)
[^3]: [The Rust Reference - Static and dynamic C runtimes](https://doc.rust-lang.org/reference/linkage.html#static-and-dynamic-c-runtimes)
[^4]: [Docker Docs - Create a minimal base image using scratch](https://docs.docker.com/build/building/base-images/#create-a-minimal-base-image-using-scratch)
[^5]: [Unbounded Spigot Algorithms for the Digits of Pi - Jeremy Gibbons](https://www.cs.ox.ac.uk/jeremy.gibbons/publications/spigot.pdf)