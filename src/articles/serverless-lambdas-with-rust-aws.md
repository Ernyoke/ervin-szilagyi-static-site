# Serverless Lambdas with Rust on AWS

## Intro

Recently I started playing around with Rust. Yes, there is a Rust bandwagon on which I decided to jump, but ultimately I don't regret it. I consider Rust to be pretty unique compared with the languages (Java, JavaScript, Python) I work on a daily basis. Since at my current job I have to build an maintain a bunch of Lambda function, I was thinking about bringing it to the cloud and see how does it fair compared to what I'm used to.

## Lambda Runtime Environment for Rust

If we take a look at the [AWS documentation](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html) for Lambda runtimes, we can see that Rust is not on the list of supported languages out of the box. Well that's maybe discouraging at first, but it turns out that this is not a huge issue at all. There absolutely is support for Rust, in fact the [official blog post](https://aws.amazon.com/blogs/opensource/rust-runtime-for-aws-lambda/) announcing the Rust implementation for the Lambda runtime is from more than 4 years ago. Using this runtime implementation we can build a executable for a Custom Lambda Environment.
The lambda runtime is a crate, it is a dependency which will be packaged with our own code.

## Create a Lambda Project for Rust

The easiest way to create a Lambda project for Rust language is to use [`cargo-lambda`](https://www.cargo-lambda.info/guide/what-is-cargo-lambda.html), which can be installed following the instruction from the [documentation](https://www.cargo-lambda.info/guide/installation.html).
To create a new project, we can use the following command:

```
cargo lambda new function-name
```

This will prompt a questions for us asking about the event type we will plan to use to launch the Lambda. Afterwards, it will generate the project with the required dependencies for the Lambda runtime and with the AWS SDK based on the event we have chosen. For example, for a function which can be invoked by the an API Gateway - REST endpoint, `cargo lambda` will generate something like this:

```
[package]
name = "fn-test"
version = "0.1.0"
edition = "2021"

[dependencies]
lambda_http = { version = "0.6.0", default-features = false, features = ["apigw_rest"] }
lambda_runtime = "0.6.0"
tokio = { version = "1", features = ["macros"] }
tracing = { version = "0.1", features = ["log"] }
tracing-subscriber = { version = "0.3", default-features = false, features = ["fmt"] }
```

We can notice that the generated code include `tokio` crate. The Lambda runtime and the AWS API for Rust relies heavily on `tokio` for asynchronous calls and invocations. We get the following handler for our Lambda as well:

```lang-rust
use lambda_http::{run, service_fn, Body, Error, Request, RequestExt, Response};

async fn function_handler(event: Request) -> Result<Response<Body>, Error> {
    let resp = Response::builder()
        .status(200)
        .header("content-type", "text/html")
        .body("Hello AWS Lambda HTTP request".into())
        .map_err(Box::new)?;
    Ok(resp)
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .with_target(false)
        .without_time()
        .init();

    run(service_fn(function_handler)).await
}
```

## Build and Deploy the Lambda

In order to build a Lambda, we ca also rely on the help of `cargo-lambda` tool. For building the project, we can run the following command:

```
cargo lambda build --release
```

This will build our Lambda targeting the `x86-64` architecture. For Graviton, we can add the `--arm64` flag. It is that simple. We can notice that, that the architecture of our current machine does not matter when building the Lambda. We can create a target package for `x86` or for `arm64`, regardless if we are on a shiny MacBook M1 machine or a intel/AMD based PC/laptop. The `cargo-lambda` tool makes sure to hide the complexity of building Rust executables from us.


## Links and References

1. Lambda runtimes: [https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html)
2. Rust Runtime for AWS Lambda: [https://aws.amazon.com/blogs/opensource/rust-runtime-for-aws-lambda/](https://aws.amazon.com/blogs/opensource/rust-runtime-for-aws-lambda/)
3. cargo-lambda: [https://www.cargo-lambda.info/guide/what-is-cargo-lambda.html](https://www.cargo-lambda.info/guide/what-is-cargo-lambda.html)