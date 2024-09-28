# About AWS AI Practitioner (Beta) Exam

In June this year, AWS announced 2 new certification exams: the AI Practitioner exam and the Machine Learning Engineer Associate exams. At the same time, AWS has the Machine Learning Specialty (MLS-C01) certification. You can still take this exam, and at the point of writing this article, there is no news of being retired. However, we can assume that the Machine Learning Engineer Associate will take its place.

Conversely, the AI Practitioner certification is an entirely new exam, the second foundational level certification aside from the AWS Cloud Practitioner one. Foundational level certifications are considered to be "entry" level certifications. They can be attempted by people who do not necessarily have an in-depth technical knowledge of cloud concepts.

From pure curiosity, I decided to attempt this certification. In my day-to-day job, I had the chance to work with AWS technologies and with LLM models lately, so I thought it would be an interesting challenge.

## Exam Overview

The exam is intended not only for IT professionals, but also for people working as business analysts, sales and marketing professionals, and IT managers. It relies mainly on theoretical knowledge, it does not require as much hands-on experience as an associate or professional-level exam. This does not mean that it does not have its challenges.

The exam consists of 85 questions which should be answered in 120 minutes (I think I had 130 minutes according to the Pearson online testing). You can opt for accommodation of an extra 30 minutes, in case English is not your mother tongue. I did not do that, but I recommend considering it if you are in a similar situation as myself.

Aside from the multiple choice, multiple selection types of questions, AWS recently introduced new question types: ordering, matching, and case studies. At this point, I believe, AWS is A/B testing these new types of questions, since I did not encounter any of them during my session.

## What You Need to Know for the Exam?

Considering that this is my 8th AWS certification, I can affirm that the exam was more challenging than expected. Regardless of the level of your AWS cloud and AI/machine learning knowledge, I strongly suggest taking the time and doing some meaningful preparation. To aid with that, I will present my learning plan and what I think you should know to take the exam successfully. However, I suggest considering a fully-fledged course.

Note: bare in mind, that this is not a comprehensive guide. If you seriously considering attempting this certification, you may want to enroll in a training provided by AWS or by a third-party trainer. See the next section for my recommendation for courses and learning material.

My training guide does not specifically respect the order of the domains enumerated in the [official exam guide](https://d1.awsstatic.com/training-and-certification/docs-ai-practitioner/AWS-Certified-AI-Practitioner_Exam-Guide.pdf), which I strongly suggest that you read. That being noted, these are the topics I learned about during my preparation:

### 1. Cloud Computing Basics

For the exam, you need to have a clear understanding of some basic concepts related to cloud computing, such as:
- Cloud vs on-prem: what are the advantages, what are the drawbacks of both
- Public vs private cloud
- Pricing of cloud services: one important keyword that you will encounter is **on-demand**. Everything in the cloud is pay-per-use, you only pay for what you use. Whenever you see a question talking about pricing, as a rule of thumb, you can default to the answer that mentions the **on-demand** keyword. Of course, there might be exceptions, so use your best judgment.

### 2. Basic Machine Learning Concepts

For the exam, you will need to have surface-level knowledge about machine learning concepts and algorithms. It is not expected to have any in-depth knowledge about these topics, but you should be able to recognize them and know their usage. The concepts are the following:
- AI/Machine learning: what is AI and what is machine learning? What use cases are solved by AI systems?
- AI application components: data layer, ML algorithms, model layer, application layer.
- Neural Networks: what are neural networks? Also, you should know about their components: neurons, layers, activation functions, and loss functions.
- You should understand what backpropagation is: the process of updating the weights in the network to minimize the loss function
- Deep Learning: understand what it is and for what is used. Remember the keyword **convolution**, it is used for a type of deep learning network (named convolutional networks) of which main use cases are computer vision and image recognition.
- GenAI: what is generative AI and what is it used for?
- Transformer Models/Diffusion Models/Multi-Modal Models: these are "GenAI" models. There is a high chance that you will see some questions asking about some properties of these models, so it is recommended that you have a minimal understanding of them. Other than that, you probably won't need to go into details about their inner working.
- Supervised vs. Unsupervised learning: you should know the difference between them and you should know when one is better to use compared to the other.
- Reinforcement Learning (RL): how does it work? What is used for (again, important to know some use cases)
- Machine learning model training and evaluation:
    - Model fit: the exam also goes into some more technical topics such as **underfitting** and **overfitting**. These two concepts are used while training a model. A model is underfitting if it does not perform well on the training data. It is overfitting if it does perform well on the training data but it does perform poorly on the evaluation/real world data. If none of these applies to your model, then we can assume you have a **balanced** model.
    - **Bias** and **variance**: both of these are errors that are introduced by your model. A model is biased, when it constantly makes the same error in the result. This comes from erroneous assumptions in the learning. The variance of a model comes from its sensitivity to small fluctuations in the input data. For the exam, you should be able to detect whether a model is highly biased or it has a high variance. Also, you should know how bias and variance relate to the model fit. As an example, a model that has a high variance will also overfit. Similarly, a model with a high bias will probably underfit.
    - Model evaluation metrics: it is expected that you are familiar with concepts of how to evaluate a model. It is not required to know the math behind those concepts, but it expects you to know when you should use one metric versus another. These metrics are the following:
        - Metrics used for classification models:
            - **Confusion Matrix**: used to evaluate the performance of classification models. It is usually structured as a square matrix, where rows represent the actual classes, and columns represent the predicted classes.
            - **Accuracy**: measures the fraction of correct prediction.
            - **Recall (or Sensitivity)**: measures the true positive rates of the predictions.
            - **Precision**: measures the correct positive rate.
            - **Specificity**: measures the true negative rate.
            - **F1 score**: combines precision and recall into a final score. Use it when both precision and recall are considered important for evaluating your model.
        - Metrics used for regression models: similar to the metrics from the classification models, you don't need to know the formulas and mathematics behind these metrics. What you should know for the exam is to recognize them and know if they can be used with a presented model or not:
            - **MAE (Mean Absolute Error)**: measures the average magnitude of errors between the predicted values and the actual values.
            - **MAPE (Mean Absolute Percentage Error)**: used to assess the accuracy of a predictive model by calculating the average percentage error between the predicted values and the actual values. MAPE expresses the error as a percentage.
            - **RMSE (Root Mean Squared Error)**: measures the average magnitude of the error between the predicted values and the actual values, with a higher emphasis on larger errors.
            - **R Squared**: explains variance in our model. R2 close to 1 means predictions are good.
        - Metrics used to evaluate LLMs - the exam might ask you about evaluating the performance of a large language model. In this case, you would want to know about these:
            - **Perplexity loss**: measures how well the model can predict the next word in a sequence of text
            - **Recall-Oriented Understudy for Gisting Evaluation (ROUGE)**: a set of metrics used in the field of natural language processing to evaluate the quality of machine-generated text.

### 3. Generative AI and AWS Services for GenAI

The exam expects you to be familiar with GenAI models. Obviously, it does not expect you to know about their inner workings, but you should have experience using them. To give you an example, you might be asked to know if, for a certain problem, you would want to use a GenAI-based model or another "legacy" ML model.

Probably the most important AWS service for this exam is **AWS Bedrock**. You might expect around 15-20 questions involving Bedrock in one way or another. Bedrock is essentially a one-stop-shop for GenAI models. It gives you access to a dozen of **Foundation Models**, such as Amazon Titan, a few Anthropic models (**Claude**), and other models from AI21labs, Cohere, stability.ai, Meta (llama), Mistral, etc. Aside from giving access to build on these models, Bedrock offers a bunch of other features. Relevant for the exam are the following:
- **Knowledge Bases**: a solution provisioning and using **vector databases**. You may want to use vector databases if you are building a system based on **RAG (Retrieval Augmented Generation)**.
- **Agents**: Bedrock's way of doing function calling. You can integrate your model with an "action", meaning that aside from answering a message, the model would be able to perform tasks, such as executing a Lambda Function.
- **Guardrails**: you can use them to limit the ability of a model in terms of what it should be able to answer. Aside from that, Guardrails offer other features such as detecting PII data and removing them from the answer.
- **Model Evaluation**: you can evaluate a model with AWS-provided metrics or by using human power.

Aside from these, there are other features of Bedrock the exam might ask about (Bedrock Studio, Watermark Detection). I strongly recommend doing some hands-on practice with Bedrock and experiencing what it has to offer.

Another GenAI-based AWS service is **Amazon Q**, which is a fully managed GenAI assistant for enterprise usage (whatever that means). It combines a lot of stuff into one service. It has a few flavors:
- **Amazon Q Business**: it is a question-answer-based chatbot built on Amazon Bedrock. It can ingest your company-owned internal data, and it will be able to answer your questions based on that data.
- **Amazon Q Developer**: it servers two completely different use cases:
    - It is a chatbot built on AWS documentation, so it can answer your questions related to AWS services.
    - It is a code companion (previously known as CodeWhisperer) similar to GitHub Copilot. It can generate source code. It can integrate with a bunch of IDEs and it can help you write code.

I personally would not worry much about Amazon Q for the exam. According to my experience, there are not a lot of questions about this service. On the other hand, it is important to make sure you don't confuse Amazon Q with Kendra, another service built for similar purposes. The exam might put them face-to-face, but you should be able to decide which one to choose for your scenario.

### 4. Prompt Engineering

Before embarking on my learning journey for the AI Practitioner certification I considered prompt engineering a pseudo-science. My rule of thumb was (and it still is) that if you need better answers from a model, give it as much information as you can. During my preparation, and while building AI chatbots at my workplace, I learned that there are some useful prompting techniques with which you can get way better answers compared to what I was used to before. 

For the AI practitioner certification you should be aware of the following prompting techniques:

- **Zero-Shot Prompting**: it is a more "scientific" definition of what I was doing before adopting any prompt engineering techniques. You just throw a query to the model without any specific wording/formatting or examples of expected output. The output of the model may vary, it might be useful for you or it might be total garbage.
- **Few-Shots Prompting**: you provide a prompt with examples of what you would expect as an output from the model. Unexpectedly, this prompting technique works better than I would have imagined. In terms of the exam, you should choose this technique in cases when you are asked for a low-cost solution with the most precision
- **Chain of Thought Prompting**: you divide your queries into a sequence of reasoning steps, and you use sentences like "Think step by step". As a tangent, GPT o1 model uses chain of thought prompting under the hood. This made this technique very popular recently, so expect some questions about it
- **Retrieval-Augmented Generation (RAG)**: RAG is also considered a prompting technique. It relies on using a vector database to fetch content related to the user query. This content is then injected into the user prompt as additional context.

Related to the prompt engineering, the exam might ask you about hyperparameters you can set for a model to optimize its responses. Parameters you should be aware of are the following:

- **Temperature**: value between 0 and 1.0, defines the creativity of a model. The higher the value, the more creative responses you will get.
- **Top P**: value between 0 and 1.0, defines the size of the set of available words when generating the parts of an answer. For example, for a value of 0.25, the model will use the 25% most likely next word.
- **Top K**: similar to Top P, but it is an integer value. By setting a Top K value, we tell our model that it only should use words from the next Top K available options.

The general rule for the hyperparameters is that setting lower values will make your model more conservative and give more coherent responses while setting a parameter to a higher value will result in more creative and less coherent responses.

### 4. Amazon SageMaker

Another important AWS service for the exam is Amazon SageMaker. SageMaker is a managed service used by data and machine learning engineers to build, train, and deploy machine learning models. Like other AWS services, it has a bunch of features. I will try to mention only those that might appear in the exam, although I encountered some unexpectedly strange questions during my session. These questions were considerably more challenging, and I felt they were taken from the Machine Learning Specialty exam question set.

One of the most important offerings of Sagemaker is **SageMaker Studio**. At first glance, this looks like a managed Jupyter Notebook, where a machine learning engineer can write Python code. It is way more than that. Part of SageMaker Studio is **Data Wrangler**, used for feature engineering and data preparation before training. From Data Wrangler we can publish data into **SageMaker Feature Store**.

Part of SageMaker Studio is **SageMaker Clarify**. It is used to evaluate foundation models against AWS-provided metrics or metrics provided by you. It even lets you leverage human intervention (have your employee evaluate the model, or use Ground Truth). SageMaker Clarify has a specific feature you should be aware of for the exam, this is **Model Explainability**. This is used to explain why you get certain outputs from a model and what kind of feature influenced the output.

**SageMaker Ground Truth** is another sub-service the exam expects you to know about. It is based on **Reinforcement Learning from Human Feedback (RLHF)**, whenever you see this keyword, think of Ground Truth and vice-versa. Ground Truth is used to review models, do customizations, and do evaluations based on human feedback. 

In terms of ML Governance, you should be aware of **SageMaker Model Cards**, **SageMaker Model Dashboards**, and **SageMaker Role Manager**. Model Cards lets you create cards with essential information about a model. Model Dashboard is a centralized repository for ML models.  It displays insights for each model such as risk ratings, model quality, and data quality. Role Manager lets you create and define roles for AWS users.

**SageMaker Model Monitor** lets you monitor the quality of your models deployed in production. You can also create alerts for your models.

**SageMaker Pipelines** allows you to create pipelines for training and deploying models. Whenever the exam asks about MLOps-related services, most likely SageMaker Pipeline would be the correct answer.

Model Fine-Tuning: in the exam, you might face questions about model fine-tuning. You may want to use fine-tuning when you want to take an existing model and do some additional training on it with your data. **SageMaker JumpStart** is one of the places where you want to start fine-tuning a model. 

The exam also likes to compare fine-tuning with other preparation techniques of an LLM model. In case you are faced with a comparison based on price, you would want to keep in mind the following order:

1. Prompt engineering (excluding RAG): least expensive
2. RAGs: they are more expensive than other prompt engineering techniques because they usually require the presence of a vector database
3. Instruction-based fine-tuning: it is a fine-tuning approach that uses labeled data to modify the weights of a model. It requires model training, which demands specific hardware, so it is considered more expensive than RAGs
4. Domain adaptation fine-tuning: uses unlabeled data for fine-tuning, it is the most expensive approach

Other SageMaker sub-services you would want to look up are the following: **SageMaker Canvas**, **MLFlow for SageMaker**, **Automatic Model Tuning**. Moreover, SageMaker provides a bunch of built-in machine-learning algorithms (for example: XGBoost, DeepAR, Seq2Seq, etc.). You may want to check them out, to at least recognize them if they pop up during the certification.

SageMaker is an advanced topic. It is somewhat baffling to me, that it AWS expects you to have such an amount of knowledge about it, considering that the exam is recommended to individuals who won't ever use this product. If you are comfortable writing a few lines of code and you know what a Jupyter Notebook is, I recommend doing some hands-on practice with SageMaker.

### 5. AWS Managed AI Services

AWS offers a comprehensive list of AI services that are managed and trained by them. The list of the services you should be aware of are the following:

- Amazon Comprehend and Amazon Comprehend Medical: extract relevant information from documents of all kinds.
- Amazon Translate: an on-demand translation service, think of it as an on-demand version of Google Translate.
- Amazon Transcribe and Amazon Transcribe Medical: speech-to-text service.
- Amazon Polly: text-to-speech service.
- Amazon Rekognition: used for image recognition and classification.
- Amazon Forecast: used with time series data to forecast stuff. Discontinued by AWS, but is still part of the exam.
- Amazon Lex: it is similar to Amazon Q, or an Amazon Bedrock agent. It is technically Alexa as a service.
- Amazon Personalize: recommendation service.
- Amazon Textract: used to extract text from images (OCR).
- Amazon Kendra: it is a document search service. It is somewhat similar to Amazon Q, but it is way more restricted and it cannot do summarization (good idea to keep this in mind!)
- Amazon Mechanical Turk: it is not necessarily an AI service. With Mechanical Turk you rely on a human workforce to carry out certain tasks for machine learning, such as labeling, classification, and data collection. 
- Amazon Augmented AI (A2I): likewise Mechanical Turk, is not necessarily a managed AI service. It is a service that lets you conduct a human review of machine learning models. It can use Mechanical Turk under the hood.
- AWS DeepRacer: this is also an interesting thing to mention. It is a game, where you use reinforcement learning to drive a race car. While DeepRaces is still part of the exam, the service is discontinued by AWS.

The exam might present a task and it might ask which service would be able to solve that task. It also might put one of these services head-to-head with Bedrock or Amazon Q.

### 6. AI Challenges and Responsibilities

The exam will ask you about generative AI challenges and how to overcome them. A few challenges you should keep in mind are the following:

- Regulatory violation
- Social risks
- Data security and privacy concerns
- Toxicity
- Hallucinations
- Nondeterminism

You should be able to detect what are the challenges of a given AI application. You might be asked to find solutions to overcome some of these challenges. As an example, to overcome hallucinations, you can use Knowledge Bases and RAGs, to overcome toxicity you can use Guardrails. To reduce nondeterminism, you can tune the model's hyperparameters (temperature, Top P, Top K).

Another important topic that may pop up is governance. Governance represents a set of practices that you have to adhere to when developing AI products. For example, you should be able to address ethical concerns of an AI-based solution, you should take into consideration bias and fairness, you should adhere to regulatory and compliance restrictions, you should pay attention to your data lineage and cleanliness, etc. There are a few AWS services you should recognize when talking about governance. These are AWS Config, Amazon Inspector, AWS Audit Manager, AWS Artifact, AWS CloudTrail, AWS Trusted Advisor.

Generative AI Security Scoping Matrix: it is a framework designed to identify and manage security risks associated with deploying GenAI applications.
It is used to classify your app in 5 defined GenAI scopes, from low to high ownership:

- Scope 1: your app is using public GenAI services
- Scope 2: your app is using a SaaS with GenAI features
- Scope 3: your app is using a pre-trained model
- Scope 4: your app is using a fine-tuned model
- Scope 5: your app is using a self-trained model

### 7. AWS Security Services and Other Services

For the exam, you should be aware of a list of AWS services. As the themes go with other topics, you should have a surface-level knowledge about them. Most importantly, you should know when to use which.

The most important service you will be asked about is **AWS Identity and Access Management (IAM)**. It is used to define roles and access policies. Whenever you as a human want to do anything in your AWS account, you need permissions for that action. This permission is granted by using roles and policies. Similarly, when a service wants to interact with another service, it needs to have a role assigned which grants the access. In some cases there this interaction can also be facilitated with service policies. The exam does not go into detail when one should be used or another. The important thing to remember is that whenever you are asked about security, you should think of IAM.

Another important service that will pop-up is S3. S3 is an object storage service, think of it as Google Drive on steroids. Whenever the exam asks about storage for model input/out, you would want to default to S3.

EC2 is also an important service. EC2 provides virtual machines. In the context of machine learning, you need EC2 instances for training and inference. There are several types of EC2 instances. For the exam, you may want to remember the following ones:

- P3, P4, P5, G3, G6 instances: These are instances with a GPU assigned to them, they can be used for training and for inference as well;
- **AWS Trainium** and **AWS Inferentia**: these are instances specifically built for training and inference. They provide a lower cost for either training or inference.

The exam might mention spot instances. Spot instances are EC2 instances running at a lower cost. You can get a spot instance by bidding on it. You get them at a lower price compared to what you would pay for an on-demand instance. The catch with them is that they can be taken away from you if somebody bids a higher price or they are needed for some other purpose. 

Networking:

- You should know what is a VPC.
- VPC Endpoints: they are used to communicate with AWS services from a private VPC. The traffic won't reach the public internet when using a VPC Endpoint.

Other services:

- CloudWatch: used for monitoring and logging
- CloudTrail: used for having a trail about any action in an AWS account
- AWS Config: used to enforce compliance in an account
- AWS Lambda Function: serverless functions that run only when needed. In the context of this exam, usually they are used for integration between 2 services

## Courses and Practice Exams that I Recommend

The previous section aimed to present what you need to know to pass the exam. It is not comprehensive material, it might have missing topics or might be inaccurate. If you want a more robust preparation plan, I recommend enrolling in a paid course.

[AWS Skill Builder](https://skillbuilder.aws/) is the official learning portal run by AWS Training and Certification. They have a learning path for the AI practitioner exam. I personally did not use this, because the video courses in the learning path do not strictly focus on exam topics. 

What I would recommend is to take one of the Udemy courses from Stephane Maarek or Frank Kane. For my preparation, I used Stephane Maarek's course. I'm also familiar with Frank's teaching style, so I'm confident in recommending his course as well. 

As a review for Stephane's course, it was the first course available on the market. I purchased it on the day he released it. I'm familiar with his teaching style from his other AWS certification courses. I like how organizes the content presented and his presentation makes it easy to take notes. The course was released early, meaning that it had some gaps in terms of the required material. It got updated after more students provided feedback to Stephane. I'm confident recommending it to anybody.

Aside from courses, you may want to take a practice exam before going into the live exam. For this purpose, Skill Builder would be the best option. Please note, that Skill Builder has also a free practice exam with 20 questions. This is a must for anybody who prepares for this certification. In case you are willing to pay, Skill Builder offers a fully-fledged practice exam with 85 questions and with explanation for each question.

On Udemy, Stephane is also selling a set of practice exams. I did not feel the need to purchase this after I finished everything on Skill Builder, so I cannot provide a review on it.

## My Experience Taking the Exam

I took the exam on Thursday morning from home through Pearson. I had no issues this time with them, everything went smoothly.

I bombed through all the 85 questions within an hour, after which I spent the next 20 minutes going through the questions I flagged. As I hinted before, the exam was not easy, it had its fair share of challenges. Most of the questions had the difficulty I expected, but it had a considerable amount picked straight from the Machine Learning Specialty question set...at least this is how I felt. Moreover, the spelling of some questions felt really awkward, putting me in a situation where I felt I had to guess what the author was looking for. I suppose this is a downside to taking a beta exam.

I did not encounter any new types of questions, all of my questions were multiple choice and multiple selection. These new types of questions are not some new innovation from AWS. Anybody, who had the chance to take a Microsoft Azure exam, should have been exposed to these types of questions. My opinion about them is that they do not affect the difficulty of the exam. On a personal level, I detest the ordering type of questions, while I prefer the case studies.

That being said, I passed without issues. My score was lower than what I expected, but at the end of the day, It is not something I care that much about.

## My List of Recommendations for You for the Exam

- Keep an eye on the clock. 85 questions are a lot. You have less than 1.5 minutes per question. Don't spend a lot of time on any single question. Many of them can be answered straight away as long as you have decent preparation. Try to select the correct answer and move on.
- If you are not sure about a question, flag it and move on. You will have time to return to it later and try to figure it out. It is important, to not panic if you don't know something at first glance.
- You will encounter questions that you won't know the answer to. This is fine. The official exam guide is intentionally vague. Any course you take, will have some gaps. Don't be sad if you encounter something entirely new during the exam. The one thing that matters is to pass it, the final score does not matter a lot.
- The exam is challenging, but with adequate training, anybody should be able to pass it. You should be fine.

## Closing Notes

Ultimately, I enjoyed the process of preparation and sitting through the exam itself. And you should be enjoying yours too. Even if it won't have any significant effect on my career, I'm proud that I was able to pass it.

I wish happy learning and good luck to anybody preparing to be an AI Practitioner!