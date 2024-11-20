# How to Build a BlueSky RSS-like Bot with AWS Lambda and Terraform

BlueSky, an alternative social media platform to the well know X (or commonly known as Twitter) is currently experiencing a surge of new users. There are multiple reasons why many people, especially from Twitter, are migrating to BlueSky, but this blog post is not about that. We want to talk about bots, **useful** bots, not spam/scam bots, obviously.

With the influx of the new user base, I also decided to create a new account there. I'm not a social butterfly, I tend to post once in a while. Seeing the activity on BlueSky, I decided to get involved in the way I can the best, which is building something useful (or at least I want to believe that is useful) for a part of the community.

As a disclaimer before going into the technicalities of building a bot:

Social media bots, especially in the context of Twitter, have a negative connotation. That is because many people are abusing them. In this article, I don't want to promote that. A bot, a client that automatically can share/re-share content on social media, can be useful. Many organizations rely on automatically posting information with a single click on multiple social media sites. I strongly condemn bots that have malicious intent in the messaging they spread, spam bots whose reason is to create as many posts as possible regardless of whether the content they share is meaningful or not, and scam bots.

## The Idea for a Bot

I become an AWS Community Builder in 2022. I've authored a few blog posts since then and I have been reading many more since then by other authors. My initial idea for a BlueSky bot was one that shares blog posts authored by fellow builders as part of [DEV.to AWS Community Builders](https://dev.to/aws-builders) organization.

This idea is not something new. A similar bot was created a while ago by another fellow community builder colleague [Jeroen Reijn](https://x.com/jreijn). If you are using Twitter and you are interested in a feed of community builder blog posts, please go and follow [@aws_cb_blogs](https://x.com/aws_cb_blogs).

How would this bot work? Pretty simple:

1. Fetch the latest blog posts from DEV.to
1. Make a nice post on BlueSky: add tags, a card with the link to the origin post, mention the author, etc.
1. Wait for N minutes
1. Go to step 1. and repeat

## Implementation of the "AWS Community Builder Blog Posts" Bot

As you can imagine, the idea is pretty simple, so the implementation would be also straightforward. That's partially true, although there might be some edge cases to handle.

First, let's take a look at the API provided by DEV.to. DEV.to is powered by Forem, an open-source platform for blogging. The API [provided by Forem](https://developers.forem.com/api/v1#tag/organizations/operation/getOrgArticles) for fetching articles from an organization is as simple as it can get. We have to specify an identifier for the organization we care about and some pagination. Articles are sorted based on the publishing timestamp from the most recent to the last recent. In terms of pagination, we have to provide the number of the page we care about (the default is 1, and it contains the most recent articles) and the number of articles per page.

As far as I'm concerned, there is no way to specify a timestamp in the past and get every more recent article. So, we have to work with pagination to come up with our own solution in order to identify which articles we already shared on BlueSky and which ones were not yet posted.

My solution is illustrated in the following state diagram:

![State diagram for the actions of the bot](img-how-to-build-a-bluesky-rss-like-bot-with-aws-lambda-and-terraform/cm-blogs-state-diagram.png)

In short, what I'm doing is the following:

1. In a loop get the the last 10 articles from the first page;
1. For all of the articles, check if they exist in a DynamoDB table;
1. Drop all the articles which already exist in the table;
1. The remaining articles are considered "new" or "recently published" articles. Save them in the table and publish them to BlueSky;
1. In case all the 10 articles are considered "new" fetch the second page as well and repeat the actions from step 1. In case there is at least one article that has already been published OR we reached page 3, stop and go to the next step;
1. Wait for 5 minutes and re-do everything from the beginning.

You might ask, how did I come up with all of these numbers? Why do I fetch 10 articles and why do I do this 3 times? To answer shortly, I'm just guessing that they are safe, even for periods where there is a higher activity, like when re:Invent happens.

To have a more educated guess, here is the number of posts done monthly by all the community builders using the organization from DEV.to (thank you Jeroen Reijn the chart):

![Number of DEV.to posts by month](img-how-to-build-a-bluesky-rss-like-bot-with-aws-lambda-and-terraform/posts-by-month.jpg)
(source: [https://bsky.app/profile/jeroenreijn.com/post/3l7uzeyay3r2u](https://bsky.app/profile/jeroenreijn.com/post/3l7uzeyay3r2u))

The number of posts fluctuates, but the periods we mostly care about are the following:

- March: this is when a new cohort of community builders arrives. At this point, everybody is enthusiastic to post something;
- December: usually, this is when re:Invent takes place. A lot of new things are introduced during this event, there are a bunch of new shiny things to write about.

For the last year, the maximum amount articles were posted in March, their number being slightly higher than 250. Having this in mind, we can state that my values chosen are probably way higher than they should be. Realistically, we don't expect that all 250 articles will be posted within a range of 5 minutes. If that were the case, I would have other things to worry about, such as BlueSky rate limits, especially for blob contents, such as images.

### Technology Stack

For the technology stack, I went with an AWS Lambda using TypeScript. For detecting which articles should I re-share, I'm using a DynamoDB. I'm using CloudWatch scheduled events to trigger the Lambda every 5 minutes. At this point, I don't have any special error-handling mechanism for Lambda (other than the obvious exception checking and logging), but I would most likely create a dead-letter queue for missed events.

For the infrastructure I'm using Terraform. Reason being I'm mostly familiar with that and it took the shortest time for me to set everything up and get running.

The whole codebase can be found on GitHub: [https://github.com/Ernyoke/bsky-aws-community-builder-blogposts](https://github.com/Ernyoke/bsky-aws-community-builder-blogposts)

If you have a BlueSky account and you want to see recently published blog posts by AWS community builders, you can follow this account: [https://bsky.app/profile/awscmblogposts.bsky.social](https://bsky.app/profile/awscmblogposts.bsky.social).

## Giving Another Try and Implementing an RSS Feed Bot for AWS News

After finishing with the "AWS Community Builder Blog Posts" bot, I wanted to move on to another topic that interests me: AWS News. AWS has an [RSS feed](https://aws.amazon.com/about-aws/whats-new/recent/feed/) for any import short announcement they make. These announcements are succinct and to the point. I think it would make sense to re-share them also on BlueSky, since there is a [similar account doing the same thing on Twitter](https://x.com/awswhatsnew) with a considerable amount of followers.

The approach to implementing this kind of bot is similar to the one for the community builder blog posts. One thing that differs is that in this case, we have to parse an RSS feed. Usually, there are only a few announcements made by AWS on a daily basis. We can extend the fetching schedule to 30 minutes (or even more). For the DynamoDB table, we can lower the provisioned READ/WRITE capacity to a small amount, since there won't be a huge number of reads and writes.

Again, the implementation for this bot can also be found on GitHub: [https://github.com/Ernyoke/bsky-aws-news-feed](https://github.com/Ernyoke/bsky-aws-news-feed)

In case you would like to follow the BlueSky account with RSS news feed from AWS, you can do it here: [https://bsky.app/profile/awsrecentnews.bsky.social](https://bsky.app/profile/awsrecentnews.bsky.social).

After I finished developing this bot, I noticed that a fellow community builder, [Thulasiraj Komminar](https://bsky.app/profile/thulasirajkomminar.com) developed his [own variant](https://bsky.app/profile/awsnews.bsky.social). You can follow whichever account you like, the more important thing is to stay updated.

## Taking it a Step Further: Re-sharing Content from Official AWS Blogs and Detecting Deprecations

In case you want to be as up-to-date as possible with all things AWS, you most likely stumbled into the [AWS News Feed](https://aws-news.com/) page. This page is created and maintained by fellow AWS Hero, [Luc van Donkersgoed](https://bsky.app/profile/lucvandonkersgoed.com). The purpose of this page is to aggregate blog posts from all the office AWS blogs. Moreover, it can detect blog posts talking about service and feature deprecations, which unfortunately are getting more frequent lately. It is a pretty impressive work, and I absolutely recommend bookmarking and following this page.

My idea was to bring both of those functionalities to my BlueSky feed. I wanted to create a bot that simply re-shares and tags all the articles from different kinds of official AWS blogs, and I also wanted to create a bot that shares posts talking about AWS service deprecations.

Long story short, I came up the the following event-based architecture:

![Event based architecture for AWS blogs and AWS deprecations Bots](img-how-to-build-a-bluesky-rss-like-bot-with-aws-lambda-and-terraform/aws-blogs-deprecations-architecture.png)

I split the so-called business logic into three parts (three Lambda Functions):

1. Fetcher Lambda: works very similar to the previous RSS-like bots I presented. It queries AWS API for blog posts, uses a DynamoDB table to detect posts that were not yet shared on BlueSky, and publishes those to an SNS topic.
1. Blogs Publisher Lambda: uses an SQS standard queue to listen to the topic. From this queue polls the messages and simply re-shares them to BlueSky.
1. Deprecations Lambda: the "fun" part of this architecture. It also has its own queue from which it gets the newly published blog posts. Before re-sharing them to BlueSky, it will use an LLM Model from Bedrock to detect if the article is about any kind of service deprecation. If it is, it will move forward and post the article to BlueSky.

What we have here is called a fan-out architecture. We have a producer Lambda (Fetcher) which produces events for multiple consumers.

### Event Sourcing with Lambda

Having an SQS queue gives a lot of flexibility and control over how are our functions invoked. Using a Lambda event source mapping we get access to features such as:

- Batching: we can group messages from a queue together and have our function invoked once for multiple messages;
- Error handling and partial batch processing: in case something fails while dealing with a message from the queue, we can have a number of retry attempts. Event source mapping allows partial batch processing. In case there is an error from one of the messages from the batch, we don't necessarily have to reprocess everything. We can reprocess only those for which the execution failed;
- Parallel concurrence invocation: we can limit how many function invocations should we have in parallel.

All of these features have to be configured when defining the event source mapper. Since, I'm using Terraform, in my case I have the following configuration for the Blogs Publisher Lambda:

```terraform
resource "aws_lambda_event_source_mapping" "blogs_event_source_mapping" {
 event_source_arn                   = aws_sqs_queue.blogs_queue.arn        # ARN of the source SQS queue
 enabled                            = true                                 # Flag used mainly for debugging
 function_name                      = aws_lambda_function.blogs_lambda.arn # Lambda ARN
 batch_size                         = 10                                   # Accept a batch of max 10 messages
 maximum_batching_window_in_seconds = 60                                   # Time to wait for messages to arrive to be able to be gathered in a batch
 function_response_types            = ["ReportBatchItemFailures"]          # Used for partial error handling of a batch

 scaling_config {
 maximum_concurrency = 5  ## Limit the number of instances of the function that can be invoked at the same time
 }
}
```

In the case of the Deprecation Lambda, I have to deal with other limitations. Since AWS decided to limit my account to 20 invocations of a base model from Bedrock, I decided to use the poor man's approach to Lambda rate limiting: setting the reserved concurrency at 1. This will allow only one instance of my function to be executed at the same time. I'm aware that with this I still can hit the rate limit imposed by Bedrock, but I feel like at this point there is not much I can do. Also, important to notice, that in this case `maximum_concurrency` has to be disabled.

### Working with AI

I'm using AI to detect if an article is about any AWS service deprecation. This works, most of the time, but in many cases, it can decide to be as disciplined as a badly behaved toddler.

What I'm doing is extracting the text content of each article. This text is provided to the bot. As a response, I expect answers to the following questions:

1. Does the article mention any deprecation of any AWS service?
1. If yes, what is the name of those services?

Moreover, I expect to get the response in JSON format.

At first, I was under impression that this should not be a big challenge for any available models Boy, I was wrong!

Both of my questions require summarization. LLM models should be pretty good at summarization. The second part of my challenge to the model is to provide the answer in structured format. 

I tried different models for this, with different degrees of success:

1. **Amazon Bedrock Titan**: it can do summarization really well. I can answer both of my questions. But, when you try to get the answers in a JSON format... we just forget about it. I was not able to get a valid JSON no matter how much I tried. I'm using LangChain's [`Structured Output`](https://python.langchain.com/v0.1/docs/modules/model_io/chat/structured_output/) and I explicitly provide the format instructions to the bot as part of the prompt. Titan manages to come up with something that is similar to a valid JSON, but every time something is off. In the end, I decided to drop it.
2. **Claude Instant**: I decided to try one of the cheapest offerings from the Anthropic models. Summarization works well enough, and it can build JSON, most of the time. What can I do when I don't get a valid JSON response? Retry. Considering that I have 20 invocations per minute (thanks AWS), this will be a perfect way to burn through those. So, yeah, I decided to try out another model.
3. **Claude Haiku**: Currently I'm using Haiku, which 99% percent of the time gives a correctly formatted JSON. When not, I just retry the request. It seems stable enough for my purposes, and I can get away with the strong rate limiting imposed by AWS.

Aside from that, I still need to refine the prompt, to avoid having false positive detections. Sometimes AI struggles with knowing what an AWS service is, or I just simply might be bad at prompting it.

### Technology Stack

In short, I'am using TypeScript for the Lambda Functions, DynamoDB for knowing what article to re-share, SNS with SQS standard for fan-out and LangChain with Claude Haiku from Bedrock. For the infrastructure I'm using Terraform.

The whole codebase can be found on GitHub: [https://github.com/Ernyoke/bsky-aws-blogs](https://github.com/Ernyoke/bsky-aws-blogs)

If you want to see the deprecations warning in your BlueSky feed, you can follow [https://bsky.app/profile/deprecatedbyaws.bsky.social](https://bsky.app/profile/deprecatedbyaws.bsky.social).

## Final Words

In conclusion, I had a lot of fun developing these bots. It was just about time for me to revisit all the features we have for streaming and event sourcing. Working with AI, although it is a lot of fun, can be challenging sometimes.

BlueSky also has the concept of starter packs. A starter pack makes it easier to follow multiple accounts at the same time with the push of a button. If you have a lot of AWS-related blog posts/articles/news in your feed, I created a starter pack for all of these bots. You can simply follow them from here: [https://go.bsky.app/EdJArRR](https://go.bsky.app/EdJArRR)

## References

1. [Forem API for Organizations](https://developers.forem.com/api/v1#tag/organizations/operation/getOrgArticles)
2. [LangChain - Structured Output](https://python.langchain.com/v0.1/docs/modules/model_io/chat/structured_output/)