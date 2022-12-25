# AWS Lambda Extensions with Rust

## What are Lambda Extensions?

AWS Lambda Extensions [where introduced](https://aws.amazon.com/blogs/compute/introducing-aws-lambda-extensions-in-preview) a while ago, with the purpose of providing a way to integrate with the Lambda Execution. They provide a solution for being able to enhance our Lambda functions with our existing monitoring, observability, security, and governance tools. This can be acomplished by being able to write code which runs in parallel with our Lambda function and listens to events coming from the Lambda runtime. These events can be lifecycle evens such as `Init`, `Invoke`, `Shut Down` events, telemetry events or even log events, generated each time the Lambda functions writes to its standard output.

There is no complex installation or configuration, in order for us to use Lambda Extensions. They are usually deployed as Lambda Layers, which can be easily attached to our Lambda function.

Some use cases for extensions are the following:

- capture diagnostic information before, during, and after function invocation;
- code instrumentation without the needing to change our Lambda code;
- fetching configurations, secrets before the functions invocation. Being able to cache these values between consecutive executions;
- detecting and alerting on function activity through hardened security agents, which can run as separate processes from the function

We can have [2 types of extensions](https://docs.aws.amazon.com/lambda/latest/dg/runtimes-extensions-api.html):

- **Internal extensions**: they are a type of extension that runs within the runtime process as a separate thread. The runtime controls the start and stop of the internal extension. An alternative approach for integrating with the Lambda environment is to utilize language-specific environment variables and [wrapper scripts](https://dev.to/aws-builders/getting-the-most-of-aws-lambda-free-compute-wrapper-scripts-3h4b).
- **External extensions**: they run in parallel with the function during its execution. They also continue running after the function has completed, offering the ability to gather telemetry a monitoring information about the Lambda function. Their way of working is similar to the [sidecar pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/sidecar) found in containerized and highly distributed systems.

In the upcoming lines we will discuss how to build external extensions for our functions. External extensions provide a higher flexibility compared to internal extensions, but they also come with their caviats.

## Why Rust?

Extensions can be developed in any language of choice. Since external extensions run in parallel with the actual function, they can be developed in entirely different programming language compared to the one chosen for the Lambda. While it's good to have this freedom of choice, AWS documentation recommends using a compiled language. The reason for this are the following:

- extensions written in a compiled language are built as self-contained binary. This is great, since they can work with any Lambda runtime, as long as we pay attention to the architecture. We can build the same extension and deploy it to both x86-64 and arm64;
- extensions can affect the performance of the Lambda function. They share resources with the Lambda Runtime, it is recommended to be performant as possible in order to avoid interfering with the Lambda.

Besides these two reasons, the option is the presence of great tooling. While developing extensions on our local machine is still a challenge, we have a some great open-source tools and libraries to aliviate some of the hurdles. In this blogpost we will use [cargo-lambda](https://github.com/cargo-lambda/cargo-lambda) to bootstrap and deploy an extension project.

## Let's Develop and Deploy an Extension

We will use `cargo-lambda` during four our extension. `cargo-lambda` is an open-source tool, the purpose of which being to help developers to build Lambda Functions and Lambda Extensions. It can generate and bootstrap Rust projects for both Lambdas and Extensions. It can help building those projects. This is important, since Lambdas and extensions need to be cross-compiled to a Linux executable binary. `cargo-lambda` makes this seemless from both Windows and MacOS environments.

First step would be to create a Rust project for our extension. This can be accomplished with the following `cargo-lambda` command:

```bash
cargo lambda new --extension project-name --logs
```
Notice that `--logs` flag in the end. This will generate a project with events needed for the [Logs API](https://docs.aws.amazon.com/lambda/latest/dg/runtimes-logs-api.html). Other option would be `--telemetry`, which would bootstrap a project with the [telemetry API calls](https://docs.aws.amazon.com/lambda/latest/dg/runtimes-extensions-api.html). We can chose any of those, the main difference would be the initial, generated Rust code. Since all the required dependencies for the extension are in the same crate, we can just simply transform our project as we wish afterwards.

We can build our project using the following command:

```bash
cargo lambda build --extension --release
```

This will build our extension in release mode, targeting `x86-64` architecture (even if we are on a Mac M1). If we want to build it for `arm64`, we can add the `--arm` flag in the end.



## References

1. Introducing AWS Lambda Extensions: [https://aws.amazon.com/blogs/compute/introducing-aws-lambda-extensions-in-preview](https://aws.amazon.com/blogs/compute/introducing-aws-lambda-extensions-in-preview)
2. Lambda Extension API: [https://docs.aws.amazon.com/lambda/latest/dg/runtimes-extensions-api.html](https://docs.aws.amazon.com/lambda/latest/dg/runtimes-extensions-api.html)
3. Getting the most of AWS Lambda free compute - wrapper scripts: [https://dev.to/aws-builders/getting-the-most-of-aws-lambda-free-compute-wrapper-scripts-3h4b](https://dev.to/aws-builders/getting-the-most-of-aws-lambda-free-compute-wrapper-scripts-3h4b)
4. Sidecar pattern: [https://learn.microsoft.com/en-us/azure/architecture/patterns/sidecar](https://learn.microsoft.com/en-us/azure/architecture/patterns/sidecar)
5. cargo-lambda: [https://github.com/cargo-lambda/cargo-lambda](https://github.com/cargo-lambda/cargo-lambda)
6. Lambda Logs API: [https://docs.aws.amazon.com/lambda/latest/dg/runtimes-logs-api.html](https://docs.aws.amazon.com/lambda/latest/dg/runtimes-logs-api.html)