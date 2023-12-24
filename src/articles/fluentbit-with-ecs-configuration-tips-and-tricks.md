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
- *Input*: defines the source from where we will attempt to collect log entries.
- *Output*: defines the sink, the destination where certain log entries will go. Fluent Bit supports multiple destinations, such as: ElasticSearch, AWS S3, Kafka our event stdout. For a full list, see the official documentation for [outputs](https://docs.fluentbit.io/manual/pipeline/outputs).
- *Filter*: the name of this section is somewhat misleading in my oppinion. Filters can be used to manipulate data, not just for filtering certain entries. With filters we can modify certain fields from the log entries or we can add/remove/rename certain information. Full list of filters can be found [here](https://docs.fluentbit.io/manual/pipeline/filters).

Not all of this sections are mandatory. Generally we need at least the input and output sections. Usually the `fluent-bit.conf` file is also refered as the main configuration file. Besides this we can have additional configuration, such as parsers. Parsers are used to parse the log entries, essentially transforming the each entry from a blob of unstructured text into an structured object, such as JSON. We can write our own parsers and save it into a `parser.conf` file. Before attempting to do this, it is important to know that Fluent Bit comes with its own pre-configured `parser.conf` file (https://github.com/fluent/fluent-bit/blob/master/conf/parsers.conf). This supports most of the popular log formats, such a Docker, nginx or syslog.

## Debugging and Troubleshooting Fluent Bit Configuration File

While working with Fluent Bit I found myself loosing a lot of time with deployments. If I wanted to see the effects certain changes I made in the configuration file, I had to rebuild the Fluent Bit image, push it to an ECR repo, restart the main service which will load the newest version of the sidecar container and the just wait for the log messages to arrive and hopefully see some meaningful change. This can be very annoying and time consuming. It is wiser to attempt to run the container locally and provide some dummy input for testing a modification in the configuration file.

What I recommend doing is building a container with a test configuration file. In this test configuration file we can set a input type to `dummy`. What will this `dummy` input do, you might ask? We can give a predefined log entry to it as input, and it will repeat this input over and over again. Additionally, if we set the output to be `stdout`, we will create a way of doing "printf debugging".

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

We can provide this input as an one-liner, but it would be more ideal if we could put this into a file a stream the content of the file. A work-around which I've been using is the write a simple bash script and use `exec` type input.

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

## Modify Log Entries with FILTER

The most basic FILTER operation is the [Modify](https://docs.fluentbit.io/manual/pipeline/filters/modify). Modify can be used to do a bunch of changes on a log entry:
    - add static fields
    - overwrite fields
    - remove fields from a log entry
    - rename fields

Adding a static value to each log entry might seem to be that useful. What makes them really cool is the ability to use environment variables. For example, we can inject the current environment/AWS region in each log entry:

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

## Nest and Lift

When working with Fluent Bit on ECS, generally it is good idea to configure our services to log in JSON format. Most of the logging libraries support this out of the box. Assuming we are logging everything in JSON format, let's say our service generate the following log entry:

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

The output for this might be a little funky, since it appears there are two `"log"` objects. In reality there is only one, this output itself is the representation of a map (dictionary) in Lua and it is a bit misleading.

```bash
[3] dummy.input: [1703451786.500213512, {"source"=>"stdout", "ecs_task_arn"=>"arn:aws:ecs:region:0123456789012:task/FluentBit-cluster/13EXAMPLE", "container_name"=>"/ecs-windows-app-task-1-sample-container-cEXAMPLE", "ecs_cluster"=>"FluentBit-cluster", "ecs_container_name"=>"sample-container", "ecs_task_definition_version"=>"1", "log"=>{"type"=>"error", "message"=>"Something happened!"}, "ecs_task_definition_family"=>"windows-app-task", "log"=>{"NESTED_container_id"=>"61f5e6EXAMPLE"}}]
```

## Routing and Multiple Outputs

## References:

1. Fluent Bit outputs: [Official Documentation](https://docs.fluentbit.io/manual/pipeline/outputs)
1. Fluent Bit filters: [Official Documentation](https://docs.fluentbit.io/manual/pipeline/filters)
1. Fluent Bit Modify: [Official Documentation](https://docs.fluentbit.io/manual/pipeline/filters/modify)

