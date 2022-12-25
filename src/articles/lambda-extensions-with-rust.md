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

## Let's Bootstrap and Deploy an Extension

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

Now that we have an existing binary built, we would want to deploy this binary to AWS. We can do this using another `cargo-lambda` command:

```bash
cargo lambda deploy --extension
```

This will deploy our extension to AWS in form of a Lambda Layer. As we've been discussing previously, our extension should be able to run besides any Lambda Runtime. By default, the `deploy` command will only enable compatibility for `provided.al2` runtime (essentially Rust, or any other compiled Lambda function). In order to enable it for other runtimes such as NodeJS or Python, we can add the `--compatible_runtimes` flag, for example:

```
cargo lambda deploy --extension --compatible_runtimes=provided.al2,nodejs16.x,python3.9
```

A whole list with all the compatible runtimes can be found in the [AWS documentation](https://docs.aws.amazon.com/lambda/latest/dg/API_CreateFunction.html#SSS-CreateFunction-request-Runtime). As a side node, I have to mention that this feature for supporting other runtimes, was implemented by myself for the `cargo-lambda` project. I hope that other people will find it as usefull as myslelf :)

The last step would be to attach our extension to an existing Lambda function. This can be done from the AWS console by simple attaching a Lambda Layer to a function.

By following this steps, we have created and deployed and extension which does essentially nothing useful. Moving on, we will develop an extensions which listens to Lambda log messages and sends it to a Kinesis Firehose stream.

## Develop a Log Router Extension for Kinesis Firehose

Many organizations employ a log aggregator framework. The reason for this is to be able to have every log messages in one place for easier operational and support tasks, debugging or even of legal purposes. By default, Lambda functions are using CloudWatch for logging. In order to integrate with another log aggregator, extensions are the perfect solution. In fact, many existing log aggregator products are already providing ready to use Lambda Extensions. For example, AWS partners such as Datadog, Dynatrace, Honeycomb, Sumo Logic, etc. have their own extensions published and ready to use for everybody. A whole list of partner can be found in the [AWS docs](https://docs.aws.amazon.com/lambda/latest/dg/extensions-api-partners.html). 

In case we use an internally developed log aggregator, or the product employed does not provide an extension out of the box, we can create on ourselves. In the following lines, we will see how to build an extension which integrates with Kineses Firehose and saves our log messages into an S3 bucket.

In the previous sections we've already seen how to bootstrap and deploy an extension. To be able to send messages to Kinesis, we can develop something like the following:

```Rust
use aws_sdk_firehose::error::PutRecordError;
use aws_sdk_firehose::model::Record;
use aws_sdk_firehose::output::PutRecordOutput;
use aws_sdk_firehose::types::{Blob, SdkError};
use aws_sdk_firehose::Client;
use lambda_extension::{service_fn, Error, Extension, LambdaLog, LambdaLogRecord, SharedService};
use lazy_static::lazy_static;
use std::env;

static ENV_STREAM_NAME: &str = "KINESIS_DELIVERY_STREAM";

// Read the stream name from an environment variable
lazy_static! {
    static ref STREAM: String = env::var(ENV_STREAM_NAME).unwrap_or_else(|e| panic!(
        "Could not read environment variable {}! Reason: {}",
        ENV_STREAM_NAME, e
    ));
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    println!("Loading extension...");
    // Register the handler to our extension
    let logs_processor = SharedService::new(service_fn(handler));

    Extension::new()
        .with_logs_processor(logs_processor)
        .run()
        .await?;

    Ok(())
}

async fn handler(logs: Vec<LambdaLog>) -> Result<(), Error> {
    // Build the Kinesis Firehose client
    let firehose_client = build_firehose_client().await;
    // Listen to all the events emitted when a Lambda Function is logging something. Send these
    // events to a Firehose delivery stream
    for log in logs {
        match log.record {
            LambdaLogRecord::Function(record) | LambdaLogRecord::Extension(record) => {
                put_record(&firehose_client, STREAM.as_str(), &record).await?;
            }
            _ => (),
        }
    }
    Ok(())
}

// Build the Firehose client
async fn build_firehose_client() -> Client {
    let region_provider = RegionProviderChain::default_provider();
    let shared_config = aws_config::from_env().region(region_provider).load().await;
    let client = Client::new(&shared_config);
    client
}

// Send a message to the Firehose stream
async fn put_record(
    client: &Client,
    stream: &str,
    data: &str,
) -> Result<PutRecordOutput, SdkError<PutRecordError>> {
    let blob = Blob::new(data);

    client
        .put_record()
        .record(Record::builder().data(blob).build())
        .delivery_stream_name(stream)
        .send()
        .await
}
```

The code itself is pretty self-explanatory. Besides having some initial boilerplate code to register our extension handler, what we are doing is listening to log events and sending those events to a Firehose delivery stream. The stream will batch the incoming events and save them in an S3 bucket.

In terms of IAM permissions, we need to give Firehose write permission to the Lambda Function. We cannot give permissions to a Lambda Layer. Since our code for the extension is running besides the Lambda, all the permissions applied to a Lambda are available for the extensions as well.


## Putting these all together

Developing and deploying Lambda Extensions can be a tedious work as we have seen above. In order to make our life easier (and also for myself to provide a reproducible example of what I was talking before), we can write some IaC Terraform code for the whole deployment process.

A working example of a Lambda Function with a Rust Extension can be found on my GitHub page: [https://github.com/Ernyoke/lambda-log-router](https://github.com/Ernyoke/lambda-log-router). It is a Terragrunt project requiring a current version of Terraform (>1.3.0) and Rust (>1.6.3).

## References

1. Introducing AWS Lambda Extensions: [https://aws.amazon.com/blogs/compute/introducing-aws-lambda-extensions-in-preview](https://aws.amazon.com/blogs/compute/introducing-aws-lambda-extensions-in-preview)
2. Lambda Extension API: [https://docs.aws.amazon.com/lambda/latest/dg/runtimes-extensions-api.html](https://docs.aws.amazon.com/lambda/latest/dg/runtimes-extensions-api.html)
3. Getting the most of AWS Lambda free compute - wrapper scripts: [https://dev.to/aws-builders/getting-the-most-of-aws-lambda-free-compute-wrapper-scripts-3h4b](https://dev.to/aws-builders/getting-the-most-of-aws-lambda-free-compute-wrapper-scripts-3h4b)
4. Sidecar pattern: [https://learn.microsoft.com/en-us/azure/architecture/patterns/sidecar](https://learn.microsoft.com/en-us/azure/architecture/patterns/sidecar)
5. cargo-lambda: [https://github.com/cargo-lambda/cargo-lambda](https://github.com/cargo-lambda/cargo-lambda)
6. Lambda Logs API: [https://docs.aws.amazon.com/lambda/latest/dg/runtimes-logs-api.html](https://docs.aws.amazon.com/lambda/latest/dg/runtimes-logs-api.html)
7. Extension Partners: [https://docs.aws.amazon.com/lambda/latest/dg/extensions-api-partners.html](https://docs.aws.amazon.com/lambda/latest/dg/extensions-api-partners.html)