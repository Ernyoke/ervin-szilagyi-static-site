# AWS Lambda Graceful Shutdown

## Intro

A common optimization technique for Lambda functions recommended by AWS is to [take advantage of execution environment reuse to improve the performance of your function](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html). This means, for example, in case we have a database connection, it is recommended for these connections to be initialized before the function handler. In case of a cold start, the Lambda execution environment will run the full initialization of the connectivity (essentially all the code before handler will be executed), while in case of warm starts, this execution will be avoided, the already initialized state being cached and reused.

The problem with this approach is that as long as something takes time and effort to be initialized, it usually also requires time and effort to be teared down gracefully. In case of database connections, it would be a best practice to disconnect and end existing connections if we know we won't use them anymore. For a long time there were no recommended solutions for building a graceful shutdown mechanism. But happily we can find some examples for graceful shutdown in the official [aws-samples](https://github.com/aws-samples/graceful-shutdown-with-aws-lambda) GitHub repositories.

## Graceful Shutdown with Lambda

Actually it is pretty simple to achieve graceful shutdown, although it may seem a little hacky. In case of a Lambda function **which is registered with an external extension**, the Lambda environment allocates 300-500 milliseconds of cleanup for the runtime process. When Lambda service is about to shut down the runtime, it will send a `SIGTERM` signal to the runtime and then a `SHUTDOWN` event to each registered external extension. We can catch the `SIGTERM` signal in our Lambda functions and execute some cleanup logic.

Let's see an example of a Lambda using NodeJS which listens to `SIGTERM` signal and attempts to do some cleanup:

```javascript
const connectionPromise = mysql.createConnection({...});

// Handler
exports.handler = async function (event, context) {
    const connection = await connectionPromise;
    // business logic here ...
};

// SIGTERM Handler 
process.on('SIGTERM', async () => {
    console.info('[runtime] SIGTERM received');

    console.info('[runtime] cleaning up');
    // perform actual clean up work here. 
    const connection = await connectionPromise;
    connection.end();

    console.info('[runtime] exiting');
    process.exit(0);
});
```

In order for this approach to work, we need to register our Lambda function with an external extension. The easiest way would be to use [CloudWatch Lambda Insights](https://docs.aws.amazon.com/lambda/latest/dg/monitoring-insights.html). CloudWatch Lambda Insight is a monitoring and troubleshooting solution for serverless applications. It is provided by AWS and it works with both `x86` and `arm64` types of Lambdas. It can be attached as a Lambda Layer to our function. Here is an example how to create a function with Lambda Insights layer using Terraform:

```terraform
resource "aws_lambda_function" "lambda" {
  function_name    = "my-function"
  handler          = "index.handler"
  memory_size      = 1024
  package_type     = "Zip"
  role             = aws_iam_role.lambda_role.arn
  runtime          = "nodejs14.x"
  filename         = "function.zip"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  timeout          = 60
  architectures    = ["arm64"]

  layers = [
    "arn:aws:lambda:${var.region}:580247275435:layer:LambdaInsightsExtension-Arm64:2" # https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Lambda-Insights-extension-versionsARM.html
  ]
}

# Zip Archive for our function
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "${path.module}/function.zip"
  source_dir  = "${path.module}/function"
}

# Lambda Role with CloudWatch Logs enabled
resource "aws_iam_role" "lambda_role" {
  name = "lambda_role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_policy" "lambda_logging" {
  name        = "lambda_logging"
  path        = "/"
  description = "IAM policy for logging from a lambda"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*",
      "Effect": "Allow"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_logging.arn
}
```

## Conclusion

In this article we've seen how we can have graceful shutdown for Lambda functions which rely on environment re-use. We built a function using the NodeJS environment. Examples for other execution environments can be found in the [AWS samples](https://github.com/aws-samples/graceful-shutdown-with-aws-lambda) project mentioned before.

## References:

1. Best practices for working with AWS Lambda functions: [https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
2. GitHub - aws-samples/graceful-shutdown-with-aws-lambda: [https://github.com/aws-samples/graceful-shutdown-with-aws-lambda](https://github.com/aws-samples/graceful-shutdown-with-aws-lambda)
3. Using Lambda Insights in Amazon CloudWatch: [https://docs.aws.amazon.com/lambda/latest/dg/monitoring-insights.html](https://docs.aws.amazon.com/lambda/latest/dg/monitoring-insights.html)