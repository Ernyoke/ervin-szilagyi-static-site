# Fluent Bit with ECS: Configuration Tips and Tricks

A while ago I wrote a [blog post](./ecs-custom-logging-with-fluentbit.md) about Fluent Bit integration with containers running in an ECS cluster. According to my statistics, this post is one of the most viewed on my blog, so I was determined to write a follow-up for it. I've been using FluentBit with ECS for more than a year in a business application running in production. During this period I had the chance to make use of and even abuse several features provided by Fluent Bit.

Generally speaking my experience with Fluent Bit in the last year was positive. In many cases, I found that it had a steep learning curve, and several times I felt I was doing things that I should not supposed to be doing. In the end, I managed to reconcile myself with how it operates and I can say for sure that it is a fast and very polished product that can handle huge production workloads.

In this blog post, I will talk about certain tips and tricks for the Fluent Bit configuration file that I found useful. Some of them might be trivial if you already have experience with it. Nevertheless, I think that they might be helpful for anybody interested in introducing Fluent Bit to their cluster of services.

This post will not provide a guideline on how to set up Fluent Bit. If you are interested in that, please read my previous post on this topic: [ECS Fargate Custom Logging with Fluent Bit](./ecs-custom-logging-with-fluentbit.md). Moreover, there are several useful articles from AWS, such as this one: [Centralized Container Logging with Fluent Bit](https://aws.amazon.com/blogs/opensource/centralized-container-logging-fluent-bit/).

## Fluent Bit Configuration Basics

Fluent Bit can be configured with a `fluent-bit.conf` configuration file or with YAML configuration. We will focus on the so-called classic `.conf` configuration format since at this point the YAML configuration is not that widespread. 

A basic configuration file would look like this:

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

- *Service*: defines global settings for the Fluent Bit container. Some examples of these kinds of settings are how often should the container flush its content, the logging level of the Fluent Bit agent, or if we would like to add additional plugins or parsers (more about parsers below).
- *Input*: defines the source from where the agent will attempt to collect records. Fluent Bit can receive records from multiple sources, such as log streams created by applications and services, Linux/Unix system logs, hardware metrics, Docker events, etc. A full list of inputs can be found in the [documentation](https://docs.fluentbit.io/manual/pipeline/inputs). When we talk about Fluent Bit usage together with ECS containers, most of the time these records are log events (log messages with additional metadata).
- *Output*: defines the sink, the destination where certain records will go. Fluent Bit supports multiple destinations, such as ElasticSearch, AWS S3, Kafka our event stdout. For a full list, see the official documentation for [outputs](https://docs.fluentbit.io/manual/pipeline/outputs).
- *Filter*: the name of this section is somewhat misleading in my opinion. Filters can be used to manipulate records, not just for filtering and dropping entries. With filters, we can modify certain fields from the records or we can add/remove/rename certain information. A full list of filters can be found [here](https://docs.fluentbit.io/manual/pipeline/filters).

Not all of these sections are mandatory in a configuration file. Generally, we need at least the input and output sections. The `fluent-bit.conf` file is also referred to as the main configuration file. Besides this file, we can have additional configurations, such as parsers. Parsers are used to read and transform raw input records into a structured object, such Lua tables (tables are the equivalent of a dictionary/map in other languages). This is required by the agent to be able to further process them with filters.  

We can write our own parsers and load them, or we can rely on the ones provided by Fluent Bit itself. It comes with its own pre-configured `parser.conf` file (https://github.com/fluent/fluent-bit/blob/master/conf/parsers.conf). These parsers support most of the popular log formats, such as Docker, nginx, or syslog.

## Debugging and Troubleshooting Fluent Bit Configuration File

While working with Fluent Bit I found myself losing a lot of time with deployments. If I wanted to see the effects of certain changes I made in the configuration file, I had to rebuild the Fluent Bit image, push it to an ECR repo, restart the main service which will load the newest version of the sidecar container, and then just wait for the log messages to arrive while hoping to see some meaningful change. This laborious process can be very annoying. It is way wiser to attempt to run the container locally and provide some test input for validating a modification in the configuration file.

We mentioned that we can have several types of `INPUT`s. One of them, having the name of `dummy`, was purposefully implemented for quick testig. It accepts a pre-defined JSON as input. It will repeatedly send this input for processing over and over again, simulating a stream of data. Additionally, if we set the `OUTPUT` to be `stdout`, we will create a way of doing "printf debugging".

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

This will launch the container that will run until we stop it with `Ctrl+C` key combination. This execution will produce an output similar to the following:

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

The problem with `dummy` is that it requires the content of the message to be inline. This can be annoying if we want to give something more complex. For example, a log event generated by the log router of an ECS containers looks like this:

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

We could provide this JSON document as a one-liner and call it a day. In my opinion, it would be ideal if we could put this into a file, and point the input to use the content of that file to generate records. Unfortunately, `dummy` input is dummy and does not support reading stuff from a file. 

A workaround that I've been using to overcome this limitation, is to have `exec` instead of `dummy`. `exec` can take the content from the standard output of a script and generate records based on that.

We can provide a simple bash script that reads and outputs the content of a file:

```bash
#!/bin/bash

# Read the content of the log entry from a file
content=$(cat log.json)

# Echo the output, which will be the input for Fluent Bit
echo $content
```

We can alter the configuration file as such:

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

The Dockerfile should also be modified to have the bash script and the log entry JSON file:

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

Parsers should not be part of the main configuration file, they should be placed into a separate file. Adhering to this requirement, Fluent Bit provides a set of parsers located under `/fluent-bit/parsers/parsers.conf` path. For these parsers to be used, we have to load them in the service section:

```bash
[SERVICE]
    Parsers_File /fluent-bit/parsers/parsers.conf
```

Parsers can work together with INPUTs, as we have already seen in the case of `exec` INPUT. We can also have separate FILTER doing the parsing:

```bash
[FILTER]
    Name parser
    Match dummy.*
    Key_Name data
    Parser dummy_test
```

As a reminder, FILTERs are used to modify data. We will discuss different types of FILTERs in the upcoming paragraphs.

## Modify Records with FILTER

The most basic FILTER operation is the [Modify](https://docs.fluentbit.io/manual/pipeline/filters/modify). Modify can be used to do a bunch of changes on a record:
    - add  fields with static values
    - overwrite fields with static values
    - remove fields
    - rename fields

Aside from static fields, we can refer to environment variables as well.  For example, we can inject the current environment/AWS region in each record:

```bash
[FILTER]
    Name                        modify
    Add environment     ${ENVIRONMENT}
    Add region                ${AWS_REGION}
```

`ENVIRONMENT` and `AWS_REGION` are environment variables and they should be specified in the task definition.

Additionally, the Modify FILTER supports conditional actions. For example, we could apply a renaming only if a certain condition is met, such as the field stars with a particular string:

```bash
[FILTER]
    Name                              modify
    Match                              *
    Rename ecs_task_definition_family family
    Condition Key_value_matches ecs_task_definition_family windows.*
```

The above FILTER will rename the `ecs_task_definition_family` field to `family` if the value of the `ecs_task_definition_family` starts with `windows.*`. Please note `windows.*` is a regular expression. Aside from the `Key_value_matches` condition, there are several other conditions we can use. All of them can be found in the [Fluent Bit documentation for Modify](https://docs.fluentbit.io/manual/pipeline/filters/modify#conditions).

## Routing and Multiple Outputs

One of the most important abilities of the Fluent Bit agent is to offer support for multiple outputs. For example, we could deliver every log message to a centralized logging aggregator which is built upon ElasticSearch, while at the same time, we could direct error messages to an alerting system. To achieve this architecture, we need to introduce the concept of routing records.

Routing requires the presence of two important other entry properties: `Tag` and `Match`. When we create an INPUT, we can add an optional `Tag` property. Every record originating from this INPUT will carry this tag. For example:

```bash
[INPUT]
    Name cpu
    Tag  cpu_usage
```

We collect the CPU usage to generate records. Each record will be tagged with `cpu_usage`. Now we can define FILTERs to process only these records with the help of `Match`:

```bash
[FILTER]
    Name          modify
    Match         cpu_usage
    Add   brand   AMD
    Add   mark    Ryzen
```

Each record tagged with `cpu_usage` will have a `brand` and a `mark` field. In case we add another input for collecting the memory usage and we tag these records with `mem_usage`, the records originating from the memory INPUT won't receive the `brand` and `mark` fields. 

Similarly, we can create multiple outputs possessing the `Match` property. As an example, we can create an OUTPUT to match everything with `cpu_usage` only and build a CloudWatch metric based on this information, while we also could save every event in an S3 bucket:

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

Note, `Match` accepts a regular expression. We can have a wildcard (`*`) to match everything.

## Nest and Lift

When working with Fluent Bit on ECS, generally it is a good idea to configure our services to log in JSON format. Most of the logging libraries support this out of the box. Assuming we are logging everything in JSON format, let's imagine our service generates the following log messages:

```json
{
    "type": "error",
    "message": "Something happened!"
}
```

The log router from ECS will embed the content of every log message under the `"log"` field, the final event having a similar format:

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

We decided we don't like our log content to be embedded under `"log"` property, so we want everything to be on the root level of the record. To do this, we can use the `Nest` FILTER. This filter has two operations, the first one being `Nest` (again, confusing I know), and the second one is `Lift`. In case we want to lift out fields to the root level, we can do the following:

```bash
[FILTER]
    Name         nest
    Match        *
    Operation    lift
    Wildcard     container_id
    Nested_under log
    Add_prefix   LIFTED_
```

This FILTER will lift everything situated under the `"log"` and put it into the root. The output will be something like this:

```bash
[5] dummy.input: [1703451474.539715464, {"source"=>"stdout", "ecs_task_arn"=>"arn:aws:ecs:region:0123456789012:task/FluentBit-cluster/13EXAMPLE", "container_name"=>"/ecs-windows-app-task-1-sample-container-cEXAMPLE", "ecs_cluster"=>"FluentBit-cluster", "ecs_container_name"=>"sample-container", "ecs_task_definition_version"=>"1", "container_id"=>"61f5e6EXAMPLE", "ecs_task_definition_family"=>"windows-app-task", "LIFTED_type"=>"error", "LIFTED_message"=>"Something happened!"}]
```

Usually, I recommend adding a prefix to the lifted fields, but this can be omitted.

Now we are happy with how our record looks, but unfortunately, our colleague does not agree with us. He suggests we keep the `"log"` object as it is and move the `"container_id"` inside that object. We can accomplish this with `Nest` operation:

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

We can notice that this output is a little bit funky, since it appears there are two `"log"` objects. This is a ["bug"](https://github.com/fluent/fluent-bit/issues/1177) in the Fluent Bit version used for this blog post. The demos and examples presented in this post are using the latest Fluent Bit docker image maintained by AWS, which at the moment of writing, is based on Fluent Bit `1.9.10`. Technically, this issue was [fixed](https://github.com/fluent/fluent-bit/commit/1d148860a8825d5f80aef40efd0d6d2812419740) in a later version of Fluent Bit. The fix consists of maintaining only the latest key in the table, resulting in an effective overwrite in case the key existed before.

So, we can enumerate a few caveats for Nest and Lift:

- As we have seen before, if we would like to nest a field into an already existing field, that is not really possible, even if the receiving field itself is a nested object. Personally, I would have preferred a possibility to merge them, but I'm fully aware that this will come with its own baggage of challenges and edge cases.
- Let's say we have a deeply nested object such as this:

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
In case we would like to lift only the `"code"` property to the root, we simply can not do this easily. We will have to lift the content of the `"log"` first and then the content of `"details"`. At this point, we essentially broke the original structure of our JSON, which is probably not what we wanted in the first place.

## Lua Scripting

If we think we need more flexibility for processing records, we can write our own [embedded filters using Lua](https://docs.fluentbit.io/manual/pipeline/filters/lua) language. [Lua](https://www.lua.org/) is a highly efficient programming language used mainly for embedded scripting.

It is relatively easy to integrate a Lua script into a Fluent Bit configuration. First, we have to define a FILTER which will call our script:

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

There are a few restrictions for this function. The function should accept the following arguments:

- `tag`: tag attached to the record, we discussed tags in detail in the routing section above;
- `timestamp`: an Unix timestamp attached to each record
- `record`: the record itself. The type of this argument is a Lua [table](https://www.lua.org/pil/2.5.html)

This function has to return 3 values:
- `code`: must be one of the following values:
    - `-1`: tells Fluent Bit to drop the current record
    - `0`: the current record was not modified
    - `1`: the current record was modified
    - `2`: the timestamp was modified
- `timestamp`: the Unix timestamp of the record, usually it is returned as it was received in the arguments
- `record`: the record itself, in the form of a Lua table.

We can do some fairly complex transformations with Lua. My suggestion is to keep it to a minimum. We have to remember that this script will be executed for every record (as long as we did not do a filter before that). Having a heavy and time-consuming transformation will result in our processing lagging, or we will end up dropping records in the worst possible scenario. Moreover, sidecar containers usually use the same resources allocated to the main service. If we attempt to steal a significant amount of resources from the main service, we might disturb its operation.

## Final Thoughts

The motivation behind this blog post was to share several ideas acquired while working with Fluent Bit sidecar container in production. Some of these might seem boring or obvious to experienced people and that is absolutely fine. Logging should be boring, without any unforeseen surprises. It should just work. 

That being said, I hope some of these tips may be helpful for somebody out there.

The code for the examples presented in this blog post can be found on GitHub: [https://github.com/Ernyoke/ecs-with-fluentbit](https://github.com/Ernyoke/ecs-with-fluentbit)

## References:

1. Fluent Bit Inputs: [Official Documentation](https://docs.fluentbit.io/manual/pipeline/inputs)
1. Fluent Bit Outputs: [Official Documentation](https://docs.fluentbit.io/manual/pipeline/outputs)
1. Fluent Bit Filters: [Official Documentation](https://docs.fluentbit.io/manual/pipeline/filters)
1. Fluent Bit Modify: [Official Documentation](https://docs.fluentbit.io/manual/pipeline/filters/modify)
1. Fluent Bit Lua Filter: [Official Documentation](https://docs.fluentbit.io/manual/pipeline/filters/lua)
1. Lua programming language: [Official Documentation](https://www.lua.org)
1. Lua - Tables: [Official Documentation](https://www.lua.org/pil/2.5.html)
