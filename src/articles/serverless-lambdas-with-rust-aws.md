# Serverless Lambdas with Rust on AWS

## Intro

Recently I started playing around with Rust. Yes, there is a Rust bandwagon on which I decided to jump, but ultimately I don't regret it. I consider Rust to be pretty unique compared with the languages (Java, JavaScript, Python) I work on a daily basis. Since at my current job I have to build an maintain a bunch of Lambda function, I was thinking about bringing it to the cloud and see how does it fair compared to what I'm used to.

## Lambda Runtime Environment for Rust

If we take a look at the [AWS documentation](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html) for Lambda runtimes, we can see that Rust is not on the list of supported languages out of the box. Well that's maybe discouraging at first, but it turns out that this is not a huge issue at all. There absolutely is support for Rust, in fact the [official blog post](https://aws.amazon.com/blogs/opensource/rust-runtime-for-aws-lambda/) announcing the Rust implementation for the Lambda runtime is from more than 4 years ago. Using this runtime implementation we can build a executable for a Custom Lambda Environment.
The lambda runtime is a crate, it is a dependency which will be packaged with our own code.

## Create a Lambda Project for Rust

The easiest way to create a Lambda project for Rust language is to use [`cargo-lambda`](https://www.cargo-lambda.info/guide/what-is-cargo-lambda.html), which can be installed following the instruction from the [documentation](https://www.cargo-lambda.info/guide/installation.html).
To create a new project, we can use the following command:

```Shell
cargo lambda new function-name
```

This will prompt a questions for us asking about the event type we will plan to use to launch the Lambda. Afterwards, it will generate the project with the required dependencies for the Lambda runtime and with the AWS SDK based on the event we have chosen. For example, for a function which can be invoked by the an API Gateway - REST endpoint, `cargo lambda` will generate something like this:

```Toml
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

```Rust
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

### What if we don't like magic?

Using `cargo-lambda` makes easier to build the necessary executable, but what is if we would want to build it ourselves? It turns out this can be kind of rabbit hole. In case our Lambda is a binary executable, this should be built targeting a Linux environment. This can be done somewhat flawlessly if our host machine is also running Linux. We just have to do the following steps:

1. Assuming we have Rust installed the [recommended way](https://www.rust-lang.org/tools/install), we should also have `rustup` tool installed for managing build toolchains. Using `rustup` we should add `x86_64-unknown-linux-musl` build target:

```
rustup target add x86_64-unknown-linux-musl
```

2. Now we can use `cargo` to build our package:

```
cargo build --release --target x86_64-unknown-linux-musl
```

### What about Windows and MacOS?

If we are running Windows, we can use WSL to have access to fully-fledged Linux environment and then we do the steps above. In case we don't want to use WSL or for some reason we can't use WSL, than we will have to do a cross-build to Linux. I personally tried the steps above from Windows, but each time I tried, I was running into a linker issue (`error: linker cc not found`). I am sure that are several ways to solve this, what I found to be the easier solution is to use [`cross`](https://github.com/cross-rs/cross). Before somebody screams at me... I know this solution is kind of a band-aid, since `cross` will rely on Docker to target different environments...but hey, it works flawlessly.

To install `cross`, we can do the following:

```Shell
cargo install cross --git https://github.com/cross-rs/cross
```

To build our Lambda, we can run the following command:

```Shell
cross build --release --target x86_64-unknown-linux-musl
```

In fact, if we want our Lambda to run on Graviton, we can very easily target ARM with `--target aarch64-unknown-linux-gnu` flag. Moreover, `cross` can be used from MacOS (M1 and standard) to target both `x84` and `arm64` architectures.


## Deploying our Lambda to AWS

The super-easy way would be to use `cargo-lambda` for deployment as well. What we have to do is to run the following command:

```Shell
cargo lambda deploy
```

That's it. Obviously, this assumes we have an AWS CLI setup locally (`aws configure`). This will provision our Lambda in AWS and will also create an execution role for it. We can override this behavior and use a pre-existing IAM role if we want by specifying the role ARN for the `--iam-role` flag.

If want to live a bit more "dangerously", and do the deployment ourselves, we essentially have to do a few more steps. Assuming that we successfully done the manual build steps from above, what we have to do next is to create a zip package. On Linux/WSL we can do it as such:

```Shell
# Run it from the a root folder of the project
cp target/x86_64-unknown-linux-musl/release/your_lambda_app_name ./bootstrap
zip lambda.zip bootstrap
```

Using the AWS CLI, we can create a Lambda with the following command:

```Shell
aws lambda create-function --function-name your_lambda_app_name --runtime provided.al2 --zip-file fileb://lambda.zip --handler bootstrap --role arn:aws:iam::123456789668:role/service-role --architectures x86_64
```

Some notes here:

- We use a custom runtime, we can chose between `provided` and `provided.al2`. It is recommended to use `provided.al2`, since this is the newer version;
- The service role has to be created in advance. `cargo-lambda` can do this automatically as we've seen this before. Here we have to do it ourselves;
- For the `architectures` we can chose either `x86_64` or `arm64`. We are providing an executable built for a specific architecture, we have to chose accordingly. If we don't specify anything, `x86_64` is used as default.

If this command run successfully, we can invoke our Lambda. Moreover, we should set a trigger, but these steps fall outside of the main topic if this article.



## Links and References

1. Lambda runtimes: [https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html)
2. Rust Runtime for AWS Lambda: [https://aws.amazon.com/blogs/opensource/rust-runtime-for-aws-lambda/](https://aws.amazon.com/blogs/opensource/rust-runtime-for-aws-lambda/)
3. cargo-lambda: [https://www.cargo-lambda.info/guide/what-is-cargo-lambda.html](https://www.cargo-lambda.info/guide/what-is-cargo-lambda.html)
4. cross: [https://github.com/cross-rs/cross](https://github.com/cross-rs/cross)