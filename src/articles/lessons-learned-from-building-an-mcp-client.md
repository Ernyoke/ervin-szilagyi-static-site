# Lessons Learned from Building an MCP Client

## Introduction

It is May 2025. By now, everyone and their mother has heard about AI agents, MCP, and all these fancy words being thrown around. According to some, MCP will change everything, while others consider it a marginal improvement over existing solutions. Having a skeptical mind, I decided to fiddle around and figure out what all the fuss is about with this shiny new technology.

## What is MCP exactly?

MCP (Model Context Protocol) is an open protocol that standardizes how applications provide context to LLMs[^1]. It is a set of rules and concepts defining how additional information can be provided to an LLM to achieve better results from prompts or how to augment LLMs with tools, such as the ability to search the web, use a calculator, or control a computer. The MCP protocol defines other concepts besides tool calling and resources, and it is likely we will see further additions in the future. Currently, tool calling is by far the most widely implemented concept from the specification.

MCP also defines the notions of MCP Servers and MCP Clients. While these resemble the classical client-server architecture, there are certain important differences, such as:

- The majority of MCP Server implementations run locally on the same machine as the MCP Client. Although the protocol provides the option for a remote server, it currently feels somewhat like an afterthought. I am confident this will be improved in the future.
- Many MCP servers are implemented to serve one user at a time. This is somewhat unheard of in the traditional server landscape. However, since most of these servers are intended to be local-first, this is to be expected.

The concepts brought together by MCP are not entirely new. Tool/function calling, for instance, was introduced by OpenAI back in 2023, after which others, such as Anthropic, followed suit with their own support and APIs. The aim of the MCP protocol is to standardize these efforts and provide a common way of implementing agentic workflows.

## My Project of Choice

Back to my project: I decided to build an MCP client. My idea was to create something similar to  [Goose CLI](https://github.com/block/goose). The initial goal was to develop a CLI tool executable from a terminal. I aimed to support multiple large language models and enable the configuration of one or more MCP servers.

My programming language of choice for this project was Java. While most online tutorials focus on JavaScript or Python, I wanted to approach this task differently. Java might not be the trendiest option, and certainly not always the most recommended choice for a CLI application, but it is not an inherently worse one. Several excellent libraries, such as [picocli](https://picocli.info/) and [jline3](https://jline.org/docs/intro) are aimed at aiding CLI application development. Additionally, [LangChain4J](https://docs.langchain4j.dev/get-started) provides an implementation for many MCP features, although it is still in an experimental phase.

Ultimately, my goal was to get a better understanding of the current state of working with LLMs and MCP using Java. I was not looking to reinvent the wheel.

## Lessons Learned

Here are a few "lessons" that I learned during development. Some of them might be obvious to anybody who spent more then few minutes with an LLM model, others are probably not.

### 1. It is really easy to build the main loop of the application

With the help of LangChain4J, it can be implemented in a few lines of code:

```java
while (true) {
    try {
        // Read something from the user 
        String line = reader.readLine(">> ", null, (MaskingCallback) null, null);
        if (line.isBlank()) {
            continue;
        }

        // Some boilerplate code to handle commands such as /exit from the user
        Optional<SessionCommand> command = toCommand(line.strip().toLowerCase());

        if (command.isPresent()) {
            switch (command.orElseThrow()) {
                case SessionCommand.EXIT:
                    return;
                // .. other commands
            }
            continue;
        }

        // This is the gist of our app. This makes an API call to the LLM, it automatically handles MCP tools calls and sends back the responses to the LLM.
        Result<String> response = llmClient.chat(line, LocalDate.now().toString());

        // Print the final answer to the user
        stylizedPrinter.printMarkDown(response.content());
    }
    catch (RateLimitException rateLimitException) {
        // ...
    } catch (Exception e) {
        // ...
    }
}
```

Since it is Java, it is not as concise as it should be, but nevertheless the main interaction with the LLM can be boiled down with this line:

```java
Result<String> response = llmClient.chat(line, LocalDate.now().toString());
```

That's it. The `llmClient` itself is an interface.

```java
public interface LlmClient {
    @SystemMessage(
            """
                    You are a general-purpose AI agent.
                    
                    The current date is: {{currentDateTime}}.

                    ...
                    """)
    Result<String> chat(@UserMessage String question, @V("currentDateTime") String currentDateTime);
}
```

We don't have to provide an implementation for this interface. All of this is handled under the hood by LangChain. It uses reflection to provide an implementation for this interface, we just have to specify that we want to use that interface for "AI" kind of purposes:

```java
return AiServices.builder(LlmClient.class)
        .chatModel(chatModel)
        .toolProvider(toolProvider)
        .chatMemory(chatMemory)
        .build();
```

I personally don't like this pattern. It makes our life harder whenever we need to debug something, it can be challenging to place a breakpoint inside something that does exists only at runtime. 


### 2. For better responses a powerful LLM model

It feels like saying that water is wet. However, in case of MCP, it is really important to have a good and powerful model.

First of all, the model should be able to support tool calling/function calling. Nowadays, most of the LLM models support tool calling, so this is not something we have to worry about.

During development I had the chance to test our a few models. To get straight to the most well know LLM providers, at moment of writing this article, the latest models from Anthropic, Claude Sonnet 4, Claude 3.7 and even Claude 3.5 are perfectly fine for "any" MCP tool calls in my opinion. I'm using quotes, because obviously there can be some counter examples here. Again, from my experience, these models are pretty good. For most of my development I used Claude Sonnet 3.5. It is faster then 3.7, most of the time, and it is good enough to focus on what it matters.

That being said, I had bad experience with Haiku 3.5. As a concrete example, I built a small MCP server for being able to query AWS cost usage based on specific time period. Whenever I asked something like what are my costs for the last month, Haiku most of the time forget what last month was. This information was explicitly provided in the system prompt `The current date is: {{currentDateTime}}.` . In the other hand Sonnet 3.5 was entirely fine remembering this piece of information and it managed to query the correct information each and every time.

Moving on to OpenAI models, the latest O1 model and GPT-4.1 and even GPT-4.5 are also good for anything. From my experience, O1 specifically, gives more natural answers compared to any Anthropic model. Claude likes to be as chatty as possible and many times answers with a lot of fluff, while O1 usually tries to stick to the topic. With GPT-4.1 I noticed something interesting. In some cases it simply avoids calling a tool and answer the question from its' own knowledge base. This might be good, it will use less tokens, but it also can be bad thing, since it can come up with some bs.

From Google I tried Gemini 2.5 Pro preview model. This model is also perfectly fine for an MCP client, especially for tool usage.

I also tried Amazon Nova models. I had a really bad experience with Amazon Titan models[^3], and unfortunately, I was still struggling with the latest AWS models. For tool usage, everything other than Nova Pro is just borderline usable. Nova Pro itself also managed to hallucinate tools on the fly. On the bright side, most of the time works, however I do not prefer the answer I get from it. Most of the time it feels like something is off. Even Haiku manages to feel more "natural", although Haiku can be dumb as rock.

The great thing is that they are many options. I prefer Sonnet models, I did most of my development using Sonnet 3.5. Probably I would recommend Gemini 2.5 Pro, at the moment of writing this article it is the cheapest as far as I checked and it is powerful enough for everything we might need it.

### 3. All kind of limits

Here is an exception I managed to receive many times while I was developing my MCP client:

```bash
Error: Rate limited by the LLM provider: {
    "error": {
        "message": "Request too large for gpt-4o in organization org-gqgox1u3NjYa2JiUAHl3HrMn on tokens per min (TPM): Limit 30000, Requested 87968. The input or output tokens must be reduced in order to run successfully. Visit https://platform.openai.com/account/rate-limits to learn more.",
        "type": "tokens",
        "param": null,
        "code": "rate_limit_exceeded"
    }
}
```

And here is another one from Claude:

```bash
Error: {"type":"error","error":{"type":"rate_limit_error","message":"This request would exceed the rate limit for your organization (874899f0-c2de-4906-8802-cc478416bee6) of 20,000 input tokens per minute. For details, refer to: https://docs.anthropic.com/en/api/rate-limits. You can see the response headers for current usage. Please reduce the prompt length or the maximum tokens requested, or try again later. You may also contact sales at https://www.anthropic.com/contact-sales to discuss your options for a rate limit increase."}}
```

The problem we may face while working with LLM models, especially if we do tool calls, is that we cannot really control the size our messages and also the rate of our messages. What do I mean by this?

- Depending on the MCP servers we use we might receive short answers that map to a message with a reduced token size;
- Depending on what the model decides, after a response from an MCP tool call, it can request further tool calls instead of providing an final answer to the initial user query. This will result on more back-and-forth communication between the our client the LLM model racking up more token usage.

The challenge with this is that you, as the MCP client developer, you cannot really intervene here in any of those cases, especially, if you develop general purpose MCP client that meant to be used with any kind of MCP server. 

Possible solutions I could think would be the following:

- Try to somehow shorten/compress large MCP server responses. If your clients somehow knows what to expect from the MCP tool call, and also knows that some parts of the response are irrelevant, you might want to extract only the meaningful part from the response.
- Try to use another model (probably from another vendor) to do a summary of the response from the MCP. This might introduce a bunch of other issues, like information loss, even more token usage (more $) and way more waiting from a final answer for the initial query.
- Apply some rate limiting. Aside that this could make the user experience way worse, it could be challenging to implement in case we want to support several models from different providers. Limits can be different for each provider, each of them is using a different tokenizer, limits can and will change over time, etc.

### 4. Let's Talk about $

Limits we talked about in the previous section are there for several reasons: to save you from raking up huge bill and also to save themselves from bad actors. Running an LLM model requires a lot of computing power and lot of energy.

I figured that this would be the time to talk about money from the perspective of a client developer. While developing this client I spent around 30$ on Claude, around 10$ on OpenAI and few buck on both Gemini and Bedrock. Models from Bedrock are barely usable because of their agressive rate limiting, so could not rake up a huge cost there even if I wanted to.

LLM providers are mainly charging based on the number of tokens used. As I mentioned before, if we add MCP tools to the mix, we kind of loose control over how much tokens we eat up with each query. This, I think, is a problem. I my client I display the number of tokens used after each user query, but I have no way to estimate neither the token usage neither the cost beforehand. In the end it is a good thing to have a limit imposed, because I can imagine that we could pretty easily go haywire with a simple query.

## References

[^1]: MCP - Introduction: [link](https://modelcontextprotocol.io/introduction)
[^2]: Langchain - Tool Calling: [link](https://python.langchain.com/docs/concepts/tool_calling/)
[^3]: How to Build a BlueSky RSS-like Bot with AWS Lambda and Terraform : [link](how-to-build-a-bluesky-rss-like-bot-with-aws-lambda-and-terraform.md)
