# Fluent Bit with ECS: Configuration Tips and Tricks

A while ago I wrote an [blog post](./ecs-custom-logging-with-fluentbit.md) about Fluent Bit integration with containers running in an ECS cluster. According to my statistics, this post is one of the most viewed on my blog, so I was determined to write a follow-up for it. I've been using FluentBit with ECS for more than year in a consumer application in production. During this period I had the change to make use of and even abuse several features provided by Fluent Bit.

Generally speaking my experience with Fluent Bit in the last year was positive. In certain cases I found that it had a steep learning curve and in certain cases I felt I was doing things which I should not supposed to be doing. In the end, I managed to reconcile myself with how it operates and I can say for sure that it is a fast and very polished product which can handle huge production workloads.

In this blog post I will talk about certain tips and tricks for the Fluent Bit configuration file that I found useful. Some of them might be trivial if you already have experience with Fluent Bit. I feel that they might be helpful for anybody interested in introducing Fluent Bit in an ECS cluster.

In this blog post we will not talk about how to set up Fluent Bit. If you are interested about that, please read my previous post in this topic: [ECS Fargate Custom Logging with Fluent Bit](./ecs-custom-logging-with-fluentbit.md). Moreover, there are several useful articles from AWS, such as this one: [Centralized Container Logging with Fluent Bit](https://aws.amazon.com/blogs/opensource/centralized-container-logging-fluent-bit/).

## Fluent Bit Configuration Basics

Fluent Bit can be configured with a `fluent-bit.conf` configuration file or with YAML configuration. In this blog post we will focus on the so called classic `.conf` format. A basic configuration file would look like this:

```
[SERVICE]
    Flush           5
    Daemon          off
    Log_Level       debug

[INPUT]
    Name cpu
    Tag  my_cpu

[FILTER]
    Name  grep
    Match *
    Regex log aa

[OUTPUT]
    Name  stdout
    Match my*cpu
```

We can notice that a configuration file can have the following sections:

- *Service*: defines global properties for the Fluent Bit container. Some example for these kind of properties are how often should the container flush its content, the logging level of the Fluent Bit container (not the service from which we gather the log entries) or if we would like to add additional plugins or parsers (more about parsers bellow).
- *Input*: defines the source from where we will attempt to collect records. Fluent Bit can receive records from multiple sources, such as log streams created by applications and services, Linux/Unix system log, hardware metrics, Docker events, etc. Full list of inputs can be found in the [documentation](https://docs.fluentbit.io/manual/pipeline/inputs). When we talk about Fluent Bit usage together with ECS containers, these records are log events (log messages with additional metadata).
- *Output*: defines the sink, the destination where certain records will go. Fluent Bit supports multiple destinations, such as: ElasticSearch, AWS S3, Kafka our event stdout. For a full list, see the official documentation for [outputs](https://docs.fluentbit.io/manual/pipeline/outputs).
- *Filter*: the name of this section is somewhat misleading in my oppinion. Filters can be used to manipulate data, not just for filtering certain entries. With filters we can modify certain fields from the records or we can add/remove/rename certain information. Full list of filters can be found [here](https://docs.fluentbit.io/manual/pipeline/filters).

Not all of this sections are mandatory. Generally we need at least the input and output sections. The `fluent-bit.conf` file is also referred as the main configuration file. Besides this file we can have additional configuration, such as parsers. Parsers are used transform input records into an structured object, such as JSON. We can write our own parsers and save it into a `parser.conf` file. Before attempting to do this, it is important to know that Fluent Bit comes with its own pre-configured `parser.conf` file (https://github.com/fluent/fluent-bit/blob/master/conf/parsers.conf). This supports most of the popular log formats, such a Docker, nginx or syslog.

## Debugging and Troubleshooting Fluent Bit Configuration File

While working with Fluent Bit I found myself loosing a lot of time with deployments. If I wanted to see the effects certain changes I made in the configuration file, I had to rebuild the Fluent Bit image, push it to an ECR repo, restart the main service which will load the newest version of the sidecar container and the just wait for the log messages to arrive and hopefully see some meaningful change. This can be very annoying and time consuming. It is wiser to attempt to run the container locally and provide some dummy input for testing a modification in the configuration file.

What I recommend doing is building a container with a test configuration file. In this test configuration file we can set a input type to `dummy`. What will this `dummy` input do, you might ask? We can give a predefined record as input, and it will repeat this input over and over again. Additionally, if we set the output to be `stdout`, we will create a way of doing "printf debugging".

For example:

We create a `fluent-bit.conf` file with the following content:

```bash
[INPUT]
    Name   dummy
    Dummy {"message": "custom dummy"}

[OUTPUT]
    Name   stdout
    Match  *
```

We create a Dockerfile for our Fluent Bit image:

```bash
FROM amazon/aws-for-fluent-bit:latest

WORKDIR /

ADD fluent-bit.conf fluent-bit.conf

CMD ["/fluent-bit/bin/fluent-bit", "-c", "fluent-bit.conf"]
```

We build the Fluent Bit docker image:

```bash
docker buildx build --platform linux/amd64 -t fluent-bit-dummy .
```

We run the image locally:

```bash
docker run --rm fluent-bit-dummy
```

This will launch the container and it will run until we stop it with `Ctrl+C` key combination. It will produce and output such as this:

```bash
$ docker run --rm fluent-bit-dummy
WARNING: The requested image's platform (linux/amd64) does not match the detected host platform (linux/arm64/v8) and no specific platform was requested
Fluent Bit v1.9.10
* Copyright (C) 2015-2022 The Fluent Bit Authors
* Fluent Bit is a CNCF sub-project under the umbrella of Fluentd
* https://fluentbit.io

[2023/12/24 16:06:59] [ info] [fluent bit] version=1.9.10, commit=557c8336e7, pid=1
[2023/12/24 16:06:59] [ info] [storage] version=1.4.0, type=memory-only, sync=normal, checksum=disabled, max_chunks_up=128
[2023/12/24 16:06:59] [ info] [cmetrics] version=0.3.7
[2023/12/24 16:06:59] [ info] [output:stdout:stdout.0] worker #0 started
[2023/12/24 16:06:59] [ info] [sp] stream processor started
[0] dummy.0: [1703434019.553880465, {"message"=>"custom dummy"}]
[0] dummy.0: [1703434020.555768799, {"message"=>"custom dummy"}]
[0] dummy.0: [1703434021.550525174, {"message"=>"custom dummy"}]
[0] dummy.0: [1703434022.551563050, {"message"=>"custom dummy"}]
[0] dummy.0: [1703434023.551944509, {"message"=>"custom dummy"}]
[0] dummy.0: [1703434024.550027843, {"message"=>"custom dummy"}]
[0] dummy.0: [1703434025.550901801, {"message"=>"custom dummy"}]
[0] dummy.0: [1703434026.549279385, {"message"=>"custom dummy"}]
^C[2023/12/24 16:07:08] [engine] caught signal (SIGINT)
[0] dummy.0: [1703434027.549678344, {"message"=>"custom dummy"}]
[2023/12/24 16:07:08] [ warn] [engine] service will shutdown in max 5 seconds
[2023/12/24 16:07:08] [ info] [engine] service has stopped (0 pending tasks)
[2023/12/24 16:07:08] [ info] [output:stdout:stdout.0] thread worker #0 stopping...
[2023/12/24 16:07:08] [ info] [output:stdout:stdout.0] thread worker #0 stopped
```

The problem with `dummy` is that it requires the content of the message to be inline. This can be annoying if we want to give something more complex, such a JSON file. For example, ECS containers generate log entries similar to this:

```json
{
    "source": "stdout",
    "ecs_task_arn": "arn:aws:ecs:region:0123456789012:task/FluentBit-cluster/13EXAMPLE",
    "container_name": "/ecs-windows-app-task-1-sample-container-cEXAMPLE",
    "ecs_cluster": "FluentBit-cluster",
    "ecs_container_name": "sample-container",
    "ecs_task_definition_version": "1",
    "container_id": "61f5e6EXAMPLE",
    "log": "10",
    "ecs_task_definition_family": "windows-app-task"
}
```

We can provide this JSON document as an one-liner, but it would be more ideal if we could put this into a file, and point the input to use that to generate records. Unfortunately, this is not supported with `dummy`. A work-around which I've been using to accomplish this is use `exec` instead of `dummy`. `exec` can take the content from standard output of the script and generate records based on that.

The bash script would look like this:

```bash
#!/bin/bash

# Read content of the log entry from a file
content=$(cat log.json)

# Echo the output, which will be the input for Fluent Bit
echo $content
```

The configuration file should be modified as such:

```bash
[SERVICE]
    Flush        5
    Log_Level    info
    Parsers_File /fluent-bit/parsers/parsers.conf

[INPUT]
    Name         exec
    Command      /generate.sh
    Tag          dummy.input
    Parser       json

[OUTPUT]
    Name   stdout
    Match  *
```

The Dockerfile should also be modified in order to have everything:

```bash
FROM amazon/aws-for-fluent-bit:latest

WORKDIR /

ADD fluent-bit.conf fluent-bit.conf
ADD log.json log.json
ADD generate.sh generate.sh

RUN chmod +x generate.sh

CMD ["/fluent-bit/bin/fluent-bit", "-c", "fluent-bit.conf"]
```

Running this container locally will print the following over and over again:

```
[0] dummy.input: [1703444437.645291508, {"source"=>"stdout", "ecs_task_arn"=>"arn:aws:ecs:region:0123456789012:task/FluentBit-cluster/13EXAMPLE", "container_name"=>"/ecs-windows-app-task-1-sample-container-cEXAMPLE", "ecs_cluster"=>"FluentBit-cluster", "ecs_container_name"=>"sample-container", "ecs_task_definition_version"=>"1", "container_id"=>"61f5e6EXAMPLE", "log"=>"10", "ecs_task_definition_family"=>"windows-app-task"}]
```

## Loading Parsers

Parsers should be defined in a different configuration file. As noted before, Fluent Bit comes with a bunch of predefined parsers which usually can be found in the `/fluent-bit/parsers/parsers.conf` location. In order for this parsers to be used, we have to load them in the service section:

```bash
[SERVICE]
    Parsers_File /fluent-bit/parsers/parsers.conf
```

Parsers can be used with certain input type as we have seen above. Moreover, we can have parser type filters:

```bash
[FILTER]
    Name parser
    Match dummy.*
    Key_Name data
    Parser dummy_test
```

As a reminder, filters are used to modify data. We will discuss different filters in the upcoming paragraphs.

## Modify Records with FILTER

The most basic FILTER operation is the [Modify](https://docs.fluentbit.io/manual/pipeline/filters/modify). Modify can be used to do a bunch of changes on a record:
    - add static fields
    - overwrite fields
    - remove fields
    - rename fields

Adding a static value to each record might seem to be that useful. What makes them really cool is the ability to use environment variables. For example, we can inject the current environment/AWS region in each record:

```bash
[FILTER]
    Name                      modify
    Add environment           ${ENVIRONMENT}
    Add region                ${AWS_REGION}
```

`ENVIRONMENT` and `AWS_REGION` are environment variables and they should be specified in the task definition.

Additionally, the Modify FILTER supports conditional actions, meaning that for example we apply a renaming only if certain condition is true, such as the field stars with a certain string.

```bash
[FILTER]
    Name                              modify
    Match                              *
    Rename ecs_task_definition_family family
    Condition Key_value_matches ecs_task_definition_family windows.*
```

The above FILTER will rename the `ecs_task_definition_family` field to `family` if the value of the `ecs_task_definition_family` starts with `windows.*`. Please note `windows.*` is a regular expression. Aside from the `Key_value_matches` condition there are a bunch of other conditions we can use. All of them can be find in the [Fluent Bit documentation for Modify](https://docs.fluentbit.io/manual/pipeline/filters/modify#conditions).

## Routing and Multiple Outputs

One of the most important ability of Fluent Bit is to have support for multiple outputs. For example, we can deliver a log message to a centralized logging aggregator which is built upon ElasticSearch, while we can also have native CloudWatch alerts and notifications at the same time, since our error logs are delivered to an SQS topic and being processed by a Lambda Function. In order to achieve this architecture, aside from having support for multiple output sink, we also need a way to determine which record goes to which output. This is solved routing.

In case of a Fluent Bit configuration file, routing requires the presence of two important concepts: `Tag` and `Match`. When we create an input, we can add an optional `Tag` property. Every record from this input will have this tag. For example:

```bash
[INPUT]
    Name cpu
    Tag  cpu_usage
```

In this example we use the CPU usage to generate records. Each record will be tagged to `cpu_usage` tag. If we want to process records which have this tag, we can use `Match` property:

```bash
[FILTER]
    Name          modify
    Match         cpu_usage
    Add   brand   AMD
    Add   mark    Ryzen
```

Each record tagged with `cpu_usage` will have a `brand` and a `mark` field. If we also have add another input for memory usage with the tag of `mem_usage`, the records originating from this input wont receive the `brand` and `mark` fields. 

Similarly, we can create multiple outputs with the `Match` property. For example, we can create mach the `cpu_usage` only and create a CloudWatch metric for our CPU usage, while we also save every event in an S3 bucket:

```bash
[OUTPUT]
    Name              cloudwatch_logs
    Match             cpu_usage
    log_stream_name   fluent-bit-cloudwatch
    log_group_name    fluent-bit-cloudwatch
    region            us-west-2
    log_format        json/emf
    metric_namespace  local_cpu_metrics
    metric_dimensions amd_ryzen_7700x
    auto_create_group true

[OUTPUT]
    Name                         s3
    Match                        *
    bucket                       fluent-bit-metrics
    region                       us-west-2
    s3_key_format                /$TAG[2]/$TAG[0]/%Y/%m/%d/%H/%M/%S/$UUID.gz
    s3_key_format_tag_delimiters .-
```

Note, `Match` accepts a regular expression. We can have a wildcard (`*`) to mach everything.

## Nest and Lift

When working with Fluent Bit on ECS, generally it is good idea to configure our services to log in JSON format. Most of the logging libraries support this out of the box. Assuming we are logging everything in JSON format, let's say our service generate the following record:

```json
{
    "type": "error",
    "message": "Something happened!"
}
```

In case of ECS, the log router will embed this content under the `"log"` field:


```json
{
    "source": "stdout",
    "ecs_task_arn": "arn:aws:ecs:region:0123456789012:task/FluentBit-cluster/13EXAMPLE",
    "container_name": "/ecs-windows-app-task-1-sample-container-cEXAMPLE",
    "ecs_cluster": "FluentBit-cluster",
    "ecs_container_name": "sample-container",
    "ecs_task_definition_version": "1",
    "container_id": "61f5e6EXAMPLE",
    "log": {
        "type": "error",
        "message": "Something happened!"
    },
    "ecs_task_definition_family": "windows-app-task"
}
```

We decide we don't like our content to be embedded under `"log"` property, so we want everything to be on the root level. In order to do this, we can use the `Nest` FILTER. This filter has two operation, the first one being `Nest` (again, confusing I know), the second on is `Lift`. In case we want to lift out fields to the root level, we can do the following:

```bash
[FILTER]
    Name         nest
    Match        *
    Operation    lift
    Wildcard     container_id
    Nested_under log
    Add_prefix   LIFTED_
```

This FILTER will lift everything under the `"log"` and put it into the root. The output will be something like this:

```bash
[5] dummy.input: [1703451474.539715464, {"source"=>"stdout", "ecs_task_arn"=>"arn:aws:ecs:region:0123456789012:task/FluentBit-cluster/13EXAMPLE", "container_name"=>"/ecs-windows-app-task-1-sample-container-cEXAMPLE", "ecs_cluster"=>"FluentBit-cluster", "ecs_container_name"=>"sample-container", "ecs_task_definition_version"=>"1", "container_id"=>"61f5e6EXAMPLE", "ecs_task_definition_family"=>"windows-app-task", "LIFTED_type"=>"error", "LIFTED_message"=>"Something happened!"}]
```

Usually, I recommend add prefix to the lifted fields, but this can be omitted.

Now we are happy with this, but unfortunately our colleague is not so. He suggest we keep the `"log"` object as it is and we move the `"container_id"` inside that object. We can accomplish this withe `Nest` operation:

```bash
[FILTER]
    Name       nest
    Match      *
    Operation  nest
    Wildcard   container_id
    Nest_under log
    Add_prefix NESTED_
```

The output after adding this section to the configuration will look similar to this:

```bash
[3] dummy.input: [1703451786.500213512, {"source"=>"stdout", "ecs_task_arn"=>"arn:aws:ecs:region:0123456789012:task/FluentBit-cluster/13EXAMPLE", "container_name"=>"/ecs-windows-app-task-1-sample-container-cEXAMPLE", "ecs_cluster"=>"FluentBit-cluster", "ecs_container_name"=>"sample-container", "ecs_task_definition_version"=>"1", "log"=>{"type"=>"error", "message"=>"Something happened!"}, "ecs_task_definition_family"=>"windows-app-task", "log"=>{"NESTED_container_id"=>"61f5e6EXAMPLE"}}]
```

We can notice that this output is a little bit funky, since it appears there are two `"log"` objects. This is actually a ["bug"](https://github.com/fluent/fluent-bit/issues/1177) in the Fluent Bit version used for this blog post. The demos in provided here are using the latest Fluent Bit docker image maintained by AWS, which under the hood at, the moment of writing, is based on Fluent Bit `1.9.10`. Technically, this issue was [fixed](https://github.com/fluent/fluent-bit/commit/1d148860a8825d5f80aef40efd0d6d2812419740) in a later version of Fluent Bit by maintaining only the latest key in the table, which may or may not be the appropriate behavior...

So, there are few caveats for Nest and Lift:

- As we have seen before, if we would like to nest an field into an already existing field, technically that will overwrite the existing one, even if the field itself is a nested object. Personally, I would have preferred to merge them, but I'm fully aware that this will come with its own baggage of challenges and edge cases.
- Lets say we have a deeply nested object such as this:

```json
{
    "source": "stdout",
    "log": {
        "type": "error",
        "message": "Something happened!",
        "details": {
            "code": 128,
            "stacktrace": "..."
        }
    },
}
```
In case we would like to lift only the `"code"` property to the root, we simply can not do this easily. We will have to lift the content of the `"log"` first and then the content of `"details"`. At this point we essentially decimated the original structure of our JSON, which is probably not what we wanted in the first place. A similar limitation applied to Nest operation as well. We are able to nest only one level deep.

## Lua Scripting

In case we want more flexibility for processing records, we can write our own [embedded filters using Lua](https://docs.fluentbit.io/manual/pipeline/filters/lua) language. [Lua](https://www.lua.org/) is a highly efficient programming language used mainly for embedded scripting.

It is very easy to integrated a Lua script into a Fluent Bit configuration. First we have to define a FILTER which will call our script:

```bash
[FILTER]
    Name    lua
    Match   *
    script  script.lua
    call    transform
```

Then, we have to create a script file (named `script.lua` in this case, but we can name it however we want) and write our function (named `transform` in this case, but again, we can name this as we wish) which will be invoked for each record.

```lua
function transform(tag, timestamp, record)
    record["from_lua"] = "hello from lua"
    return 1, timestamp, record
end
```

There are a few restriction for this function. The function should accept the following arguments:

- `tag`: tag attached to the record, we discussed tags in detail at the routing section of the blog post;
- `timestamp`: unix timestamp of each record
- `record`: the record itself. The type of this argument is a Lua [table](https://www.lua.org/pil/2.5.html)

This function has to return 3 values:
- `code`: must be one of the following values:
    - `-1`: tells Fluent Bit to drop the current record
    - `0`: the current record was not modified
    - `1`: the current record was modified
    - `2`: the timestamp was modified
- `timestamp`: the unix timestamp of the record, usually it is returned as it was received in the arguments
- `record`: record itself, in the form of a Lua table.

We can do some fairly complex transformation with Lua, since we have infinite flexibility. My suggestion is to keep it to the minimal. We have to remember that this script will be execute for each and every record (as long as we did not do a filter before that). Having a heavy and time consuming transformation will result in our log stream lagging behind, or even drop records in the worst possible case. Moreover, sidecar containers usually use the same resources allocated to the main service. If we attempt to consume a significant amount of resources from the main service, we might disturb its operation. 

## References:

1. Fluent Bit Inputs: [Official Documentation](https://docs.fluentbit.io/manual/pipeline/inputs)
1. Fluent Bit Outputs: [Official Documentation](https://docs.fluentbit.io/manual/pipeline/outputs)
1. Fluent Bit Filters: [Official Documentation](https://docs.fluentbit.io/manual/pipeline/filters)
1. Fluent Bit Modify: [Official Documentation](https://docs.fluentbit.io/manual/pipeline/filters/modify)
1. Fluent Bit Lua Filter: [Official Documentation](https://docs.fluentbit.io/manual/pipeline/filters/lua)
1. Lua programming language: [Official Documentation](https://www.lua.org)
1. Lua - Tables: [Official Documentation](https://www.lua.org/pil/2.5.html)
