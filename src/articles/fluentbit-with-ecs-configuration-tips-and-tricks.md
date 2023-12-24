# FluentBit with ECS: Configuration Tips and Tricks

A while ago I wrote an [blog post](./ecs-custom-logging-with-fluentbit.md) about FluentBit integration with containers running in an ECS cluster. According to my statistics, this post is one of the most viewed on my blog, so I was determined to write a follow-up for it. I've been using FluentBit with ECS for more than year in a consumer application in production. During this period I had the change to make use of and even abuse several features provided by FluentBit.

Generally speaking my experience with FluentBit in the last year was positive. In certain cases I found that it had a steep learning curve and in certain cases I felt I was doing things which I should not supposed to be doing. In the end, I managed to reconcile myself with how it operates and I can say for sure that it is a fast and very polished product which can handle huge production workloads.

In this blog post I will talk about certain tips and tricks for the FluentBit configuration file that I found useful. Some of them might be trivial if you already have experience with FluentBit. I feel that they might be helpful for anybody interested in introducing FluentBit in an ECS cluster.

In this blog post we will not talk about how to set up FluentBit. If you are interested about that, please read my previous post in this topic: [ECS Fargate Custom Logging with Fluent Bit](./ecs-custom-logging-with-fluentbit.md). Moreover, there are several useful articles from AWS, such as this one: [Centralized Container Logging with Fluent Bit](https://aws.amazon.com/blogs/opensource/centralized-container-logging-fluent-bit/).

## What is a configuration file?

