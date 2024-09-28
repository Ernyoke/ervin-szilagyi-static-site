# About AWS AI Practitioner (Beta) Exam

In June this year AWS announced 2 new certification exams: the AI Practitioner exam and the Machine Learning Engineer Associate exams. In the same time, AWS has the Machine Learning Specialty (MLS-C01) exam. You can still take this exam, and at the point of writing this article, there are no news of being retired, although we can assume that the Machine Learning Engineer Associate will take its place.

In the other hand, the AI Practitioner certification is an entirely new exam, the second foundational level exam aside from the AWS Cloud Practitioner one. Foundational level exams are considered to be "entry" level certifications, which can be attempted by people who do not necessary have an in-depth technical knowledge of cloud concepts.

From pure curiosity, I decided to attempt this certification. In my day-to-day job I work with AWS technologies and with LLM models lately, so I thought it would be an interesting challenge.

## Exam Overview

The exam is part of the foundational category, meaning that it is intended to not only to IT professionals, but also for people working as business analysts, sales and marketing professionals, IT managers. The exam is mainly theoretical, is not require as much hands-on experience as an associate or professional level exam. This does not mean that it is an "easy" exam, in fact I could argue for the contrary.

The exam consists of 85 questions which should be answered in 120 minutes (I think I had 130 minutes according the Pearson only testing).

Aside from the multiple choice, multiple selection type of questions, AWS is introducing new types of questions: ordering, matching and case studies. I believe at this point AWS is A/B testing these new types of questions, because I did not encounter them in my session.

## What You Need to Know for the Exam?

The exam is fairly challenging. Considering that this is my 8th AWS certification, I can say that it was more challenging then expected. Regardless of level of AWS cloud and AI/machine leaning knowledge, I strongly suggest going through the [official exam guide](https://d1.awsstatic.com/training-and-certification/docs-ai-practitioner/AWS-Certified-AI-Practitioner_Exam-Guide.pdf) and do some preparation. In the upcoming section I will recommend some courses you may consider. Before that I will present my learning plan and what I think you should know for taking the exam successfully.

Note: bare in mind, this is not a comprehensive guide. If you seriously considering attempting the exam, you should also consider enrolling in a course provided by AWS or by a third party trainer. See the next section for my recommendation for courses and learning material.

In the following I will present my learning guide for the exam. This does not specifically respect the order of the domains enumerated in the official exam guide. I think it is more logical and approachable.

### 1. Cloud Computing Basics

For the exam you need to have a clear understanding of some basic concepts related to cloud computing, such as:
- Cloud vs on-prem: what are the advantages, what are the drawbacks of both
- Public vs private cloud
- Pricing of cloud services: one important keyword what you will encounter is **on-demand**. Everything in the cloud is pay-per-use, you only pay for what you use. Whenever you see a question talking about pricing, as a rule of thumb, you can default to the answer which mentions the **on-demand** keyword. Of-course, there might be exceptions, so use your best judgment.

### 2. Basic Machine Learning Concepts

For the exam you will need to have a surface level knowledge about machine learning concepts and algorithms. The exam wont expect any in-depth knowledge about these topics, but you should be able to recognize these and know their usage. These concepts are:
- AI/Machine learning: what is AI and what is machine learning? What use-cases are solved by AI systems?
- AI components: data layer, ML algorithms, model layer, application layer
- Neural Networks: what are neural networks? Also, you should know about their components: neurons, layers, activation functions, loss functions
- You should understand what backpropagation is: the process of updating the weights in the network to minimize the loss function
- Deep Learning: understand what it is and for what is used. Remember the keyword **convolution**, it is used for a type of deep learning networks (named convolutional networks) of which main use cases are computer vision and image recognitions
- GenAI: what is generative AI and what is it used for?
- Transformer Models/Diffusion Models/Multi-Modal Models: these are "GenAI" models. There is a high change the you will see some questions asking about some property of these models, so you should have a surface level knowledge about them. Other then that, you probably wont need to go into details about their inner working.
- Supervised vs. Unsupervised learning: you should know the difference between them and you should know when is better to use one or another
- Reinforcement Learning (RL): how does it work? What is used for (important to know some use cases)
- Machine learning model training and evaluation:
    - Model fit: the exam also goes into some more technical topics such as **underfitting** and **overfitting**. These two concepts are used while training a model. A model is underfitting if it does not perform well on the training data, while it is overfitting if it does perform good on the training data but it does perform poorly on the evaluation/real world data. If none of these applies to our model, then we can say that we have a **balanced** model.
    - **Bias** and **variance**: both of these are errors that are introduced by your model. A model is biased, when it constantly makes the same error in the result. This comes from erroneous assumptions in the learning. The variance of a model comes from its sensitivity to small fluctuations in the input data. For the exam, you should be able to detect weather a model is highly biased or it has a high variance. Also, you should know how does bias and variance relates to the model fit. For example, a model which has a high variance it will also overfit. Similarly, a model with a high bias will probably underfit.
    - Model evaluation metrics: the exam expects you to know about concepts of how to evaluate a model. It does not require to know the math behind those concepts, but it expects you to know when you should use one versus another. These metrics are the following:
        - Metrics used for classification models:
            - **Confusion Matrix**: use to evaluate the performance of classification models. It is usually structured as a square matrix, where rows represent the actual classes, and columns represent the predicted classes.
            - **Accuracy**: measures the fraction of correct prediction
            - **Recall (or Sensitivity)**: measures the true positive rates of the predictions
            - **Precision**: measures the correct positive rate
            - **Specificity**: measures the true negative rate
            - **F1 score**: combines precision and recall
        - Metrics used for regression models - similarly to the metrics from the classification models, you don't need to know the formulas and mathematics behind these metrics. What you should know for the exam is to recognize them and know if they can be used with a presented ML model or not:
            - **MAE (Mean Absolute Error)**: measures the average magnitude of errors between the predicted values and the actual values
            - **MAPE (Mean Absolute Percentage Error)**: used to assess the accuracy of a predictive model by calculating the average percentage error between the predicted values and the actual values. MAPE expresses the error as a percentage, making it easier to interpret across different scales
            - **RMSE (Root Mean Squared Error)**: measures the average magnitude of the error between the predicted values and the actual values, with a higher emphasis on larger errors
            - **R Squared**: explains variance in our model. R2 close to 1 means predictions are good
        - Metrics used to evaluate LLMs - the exam might ask you about evaluating the performance of a large language model. In this case, you would want to know about these:
            - **Perplexity loss**: measures how well the model can predict the next word in a sequence of text
            - **Recall-Oriented Understudy for Gisting Evaluation (ROUGE)**: set of metrics used in the field of natural language processing to evaluate the quality of machine-generated text. I recommend remembering the **ROUGE** keyword!

### 3. Generative AI and AWS Services for GenAI

The exam expects you to be familiar with GenAI models. Obviously, it does not expect you to know about their inner workings, but you should be able to have experience using them. To give you an example, you might be asked to know if for a certain problem you would want to use a GenAI based model or another "legacy" ML model.

Probably the most important AWS service for this exam is **AWS Bedrock**. You might expect around 15-20 questions involving Bedrock in one way or another. Bedrock is essentially a one-stop-show for GenAI models. It gives you access to a dozen of **Foundation Models**, such as Amazon Titan, a few Anthropic models (remember **Claude** for the exam), and other models form AI21labs, Cohere, stability.ai, Meta (llama), Mistral, etc. Aside from giving access to use this models, Bedrock offers a bunch of other features. Relevant for the exam are the following:
- **Knowledge Bases**: a solution provisioning and using **vector databases**. You may want to use vector databases if you are building a system based on **RAG (Retrieval Augmented Generation)**.
- **Agents**: Bedrock's way of doing function calling. You can integrate your model with an "action", meaning that aside from answering to a message, the model could be able to do something else, like executing a Lambda Function.
- **Guardrails**: you can use them to limit the ability of a model in terms of what it should be able to answer. Aside from that, Guardrails offer other features such as detecting PII data and removing them from the answer.
- **Model Evaluation**: you can evaluate a model with AWS provided metrics or with using human power.

Aside from these they are other features the exam might ask for (Bedrock Studio, Watermark Detection). I strongly recommend doing some hands-on practice with Bedrock and experience what it has to offer.

Another GenAI based AWS service is **Amazon Q**, which is a fully managed GenAI assistant for enterprise usage (whatever that means). It combines a lot of stuff into one service. It has a few flavours:
- **Amazon Q Business**: it is a question/answer based chatbot built on Amazon Bedrock. It can be configured with your company owned internal data, and it will be able to answer your questions
- **Amazon Q Developer**: it servers two completely different use cases:
    - Chatbot built on AWS documentation, so it can answer your questions related to AWS services
    - Code companion (previously known as CodeWhisperer): similar to GitHub Copilot, can generate source code. It can integrate with a bunch if IDEs and it can help you write code

I personally would not worry much about Amazon Q in terms of exam. According to my experience, there are not a lot of questions present in the exam regarding Q. Also, in case you get a question asking about managed Q/A services, make sure you don't confuse Amazon Q with Kendra, another service built for similar purposes.

### 4. Prompt Engineering

Before taking the exam I considered prompt engineering a pseudo-science. My rule of thumb was (and it still is) that if you need better answers from a model, give it as much information as you can. Aside from, while preparing for the exam, and while building AI chat bots at my workplace, I learned that there are some useful prompting techniques with which you can get way better answers compared to what I was used before. 

The exam may ask you about prompt engineering techniques. You should be aware of the following ones:

- **Zero-Shot Prompting**: it is just a more "scientific" definition to what I was doing before adopting any prompt engineering techniques. You just throw a query to the model without any specific wording/formatting or examples and you rely on the model to give you something useful
- **Few-Shots Prompting**: you provide 1, 2 or many examples of what you would expect from the chatbot. Unexpectedly, for me at least, this prompting technique works better then I would have imagined. In terms of the exam, you should chose this answer in case it asks for a low cost solution and precise answers to certain queries.
- **Chain of Thought Prompting**: you divide your queries into a sequence of reasoning steps, and you use sentences like "Think step by step". As a tangent, GPT o1 model uses chain of though prompting under the hood, which made this technique very popular recently, so expect some question about this one
- **Retrieval-Augmented Generation (RAG)**: RAG is also considered a prompting technique. It relies on using a vector database to fetch content related to the user query. This content is then injected into the user prompt as additional context.

Related to the prompt engineering, the exam might ask you to know about hyper parameters we can set for a model to optimize its responses. Parameters you should be aware of are the following:

- **Temperature**: value between 0 and 1.0, defines the creativity of a model. The higher the value, you will get more creative responses.
- **Top P**: value between 0 and 1.0, defines from what kind of words can a model use when building an answer. For example, for a value of 0.25, the model will use the 25% most likely words.
- **Top K**: similar to Top P, but it is an integer value. By setting a Top K value, we tell our model that it only should use words from the next Top K available options

Generally, what you should remember about hyper parameters is that setting lower values will make your model more conservative and give more coherent responses, while setting a parameter to a higher value will result in more creative and less coherent responses.

### 4. Amazon SageMaker

Another important AWS service for the exam is Amazon SageMaker. SageMaker is a managed service used by data and machine learning engineers to build, train and deploy machine learning models. Like other AWS services, it has a bunch of features. I will try to mention only those which might appear in the exam, although I encountered some unexpectedly strange questions in my exam session. These questions were considerable more challenging, and I felt they were taken from the Machine Learning Specialty exam question set.

On of the most important offering of Sagemaker is **SageMaker Studio**. At first glance, this looks like a managed Jupyter Notebook, where a machine learning engineer can write Python code. It is way more than that. Part of SageMaker Studio is **Data Wrangler**, used to for feature engineering and data preparation before training. From Data Wrangler we can publish data into **SageMaker Feature Store**.

Part of SageMaker Studio is **SageMaker Clarify**. It is used to evaluate foundation models against AWS provided metrics, your metrics or you can leverage humans intervention (let your employee evaluate the model, or use Ground Truth). SageMaker Clarify has a specific feature you should be aware for the exam, this is **Model Explainability**. This is used to explain why do you get certain output from a model and what kind of feature did influence the output.

**SageMaker Ground Truth** is another sub-service the exam expects you to know about. It is based on **Reinforcement Learning from Human Feedback (RLHF)**, whenever you see this keyword, think of Ground Truth and vice-versa. Ground Truth is used to review models, do customizations and do evaluations based human feedback. 

In terms of ML Governance, you should be aware of **SageMaker Model Cards**, **SageMaker Model Dashboards** and **SageMaker Role Manager**. Model Cards lets you create cards with essential information about a model. Model Dashboard is a centralized repository for ML models, and displays lets you display insights for your models such as risk ratings, model quality, data quality. Role Manager lets you create and define roles for AWS users.

**SageMaker Model Monitor** lets you monitor the quality of your models deployed in production. You can create alerts for your models.

**SageMaker Pipelines** lets you create pipelines for training and deploying models. Whenever the exam asks about MLOps related services, most likely SageMaker Pipeline would be the correct answer.

Model Fine-Tuning: in the exam you might face questions about model fine-tuning. You may want to use fine-tuning when you want to take an existing model and do some additional training on it with your own data. **SageMaker JumpStart** is one of the places where you want to start fine-tuning a model. The exam also likes to compare fine-tuning with other techniques in terms of improving performance of an LLM model. In this case, you would want to keep-in mind the following order whenever the exam asks you about model configuration:

1. Prompt engineering (excluding RAG): least expensive
2. RAGs: they are more expensive then other prompt engineering techniques, because they usually require the presence of a vector database
3. Instruction-based fine-tuning: it is a fine-tuning approach and it uses labeled data to modify the weights of a model. It requires model training, which requires specific hardware, so it is considered more expensive than RAGs
4. Domain adaptation fine-tuning: uses unlabeled data for fine-tuning, it is the most expensive approach

Other SageMaker sub-services you would want to look up are the following: **SageMaker Canvas**, **MLFlow for SageMaker**, **Automatic Model Tuning**. Moreover, SageMaker provides a bunch of built-in machine learning algorithms (example: XGBoost, DeepAR, Seq2Seq, etc.). You may want to check them out, to at least recognize them if they pop-up somewhere.

SageMaker is an advanced topic. It is somewhat baffling me, that it AWS expects you to have such amount of knowledge about, considering that the exam is recommended to individuals who wont ever use this product. In case you are comfortable writing a few lines of code and you know what a Jupyter Notebook is, I recommend doing some practice with SageMaker.

### 5. AWS Managed AI Services

AWS offers a comprehensive list AI services which are managed and trained by them. For the exam you will need to know most of them. For most of the services is it enough to know for what they are used, for some of them you should be able to know about certain features as well. The list of the services you should be aware of are the following:

- Amazon Comprehend and Amazon Comprehend Medical: extract relevant information from documents of all kinds.
- Amazon Translate: on-demand translate service, think of it an on-demand version of Google Translate.
- Amazon Transcribe and Amazon Transcribe Medical: speech to text service.
- Amazon Polly: text to speech service.
- Amazon Rekognition: used for image recognition and classification.
- Amazon Forecast: used with time series data to forecast stuff. Discontinued by AWS, but is still part of the exam.
- Amazon Lex: it is similar to Amazon Q, or an Amazon Bedrock agent. It is technically Alexa as a service. You probably should worry about this service a lot for the exam, but it might appear as a distractor.
- Amazon Personalize: recommendation service.
- Amazon Textract: used to extract text from images (OCR).
- Amazon Kendra: it is a document search service. It is somewhat similar to Amazon Q, but it is way more restricted and it cannot do summarization (good idea to remember this!)
- Amazon Mechanical Turk: this is not necessarily an AI service, but I'm mentioning because it is important to be aware of it in terms of usage related to AI. With Mechanical Turk you rely on actual humans to carry out certain tasks for you, such as labeling, classification, data collection
- Amazon Augmented AI (A2I): likewise Mechanical Turk, is not necessarily a managed AI service. It is a service which lets yiu conduct a human review of machine learning models. It can use Mechanical Turk under the hood.
- AWS DeepRacer: this is also an interesting thing to mention. It is a game, where you user reinforcement learning to drive a race car. While it is still part of the exam, this service is discontinued by AWS.

Again, the most important thing for the exam is to know what is the purpose of each managed AI service. The exam might present task and it might ask which service would be able to solve that task. It also, might put one this services head-to-head with Bedrock or Amazon Q.

### 6. AI Challenges and Responsibilities

The exam will ask you about generative AI challenges and how to overcome them. A few challenges you should keep in mind are the following:

- Regulatory violation
- Social risks
- Data security and privacy concerns
- Toxicity
- Hallucinations
- Nondeterminism

The exam may ask you to detect what are the challenges based on a case study, or might ask you to find solutions to overcome some of this challenges. As an example, to overcome hallucinations, you can use Knowledge Bases and RAGs, to overcome toxicity you can use Guardrails. To reduce nondeterminism, you can configure the model's hyper parameters (temperature, Top P, Top K).

Other important topic that may pop-up is governance. Governance represents a set of practices which you have to apply to develop AI services responsibly. For example: you should address ethical concerns when developing an AI solution, you should take in consideration bias and fairness, you should adhere to regulatory and compliance restrictions, you should pay attention to your data lineage and clenliness, etc. There are few AWS services you should recognize when talking about governance. These are: AWS Config, Amazon Inspector, AWS Audit Manager, AWS Artifact, AWS CloudTrail, AWS Trusted Advisor.

Generative AI Security Scoping Matrix: it is a framework designed to identify and manage security risks associated with deploying GenAI applications.
Is used to classify your app in 5 defined GenAI scopes, from low to high ownership:

- Scope 1: your app is using public GenAI services
- Scope 2: your app is using a SaaS with GenAI features
- Scope 3: your app is using a pre-trained model
- Scope 4: your app is using a fine-tuned model
- Scope 5: your app is using a self-trained model

### 7. AWS Security Services and Other Services

Since this is an AWS exam, you should be aware of a list of AWS services. As the themes with other topics, you should have a surface level knowledge about them. Most importantly, you should know when to use which.

The most important service you will be asked about is **AWS Identity and Access Management (IAM)**. It is used to define roles and access policies. Whenever you as human you want to do anything in your AWS account, you need permissions for that. This permission is granted by using roles and policies. Similarly, when a service wants to interract with other service, it needs to have a role assigned which grants the access. In some cases there this interraction can also be facilitated with service policies. The exam does not goes into detail when should be used one or another. The important thing to remember is that whenever you are asked about security, you should think about IAM.

Another important service which will pop-up, is S3. S3 is an object storage service, think of it as Google Drive on steroid. Whenever the exam asks about storage, you would want to default to S3.

EC2 is also an important service. EC2 provides virtual machines. In the context of machine learning you need EC2 instances for training and inference. There are several type of EC2 instances. For the exam, you may want to remember the following types:

- P3, P4, P5, G3, G6 instances: These are instances with a GPU assigned to them, they can be used for training and for inference as well;
- **AWS Trainium** and **AWS Inferentia**: these are instances specifically built for training and inference. They provide a lower cost for either training or for inference.

Networking:

- You should know what is a VPC.
- VPC Endpoints: they are used to communicate with AWS services from a private VPC. The traffic wont reach the public internet when using a VPC Endpoint.

Other services:

- CloudWatch: used for monitoring and logging
- CloudTrail: used for having a trail about any action in an AWS account
- AWS Config: used to enforce compliance in an account
- AWS Lambda Function: serverless functions which run only when needed. In the context of this exam, usually they are used for integration between 2 services

## Courses and Practice Exam that I Recommend

The previous section aimed to present what you need to know to pass the exam. It is not a comprehensive material, it might have missing topics or might be inaccurate. If you want a more robust preparation plan, I recommend enrolling into a payed course.

[AWS Skill Builder](https://skillbuilder.aws/) is the official learning portal run by AWS Training and Certification. They have a learning path the AI practitioner exam. I personally did not use this, because the video courses in the learning path are not strictly focusing on exam topics. 

What I would recommend is to take one of the Udemy course from Stephane Maarek or Frank Kane. For the preparation I used Stephane Maarek course. I'm also familiar with Frank's content, so I'm confident recommending his course as well. As an opinion about Stephane's course, it was the first course available for the exam. I purchased his course on the day he released it. I'm familiar with his teaching style from his other AWS certification courses. I like how organizes the content presented and his presentation make is easy to take notes. Since this course was the first one released, it had some gaps in terms of the required material. In the meanwhile the course was and it is still updated. So I'm confident recommanding it to anybody.

Aside from courses, you may want to take a practice exam before going into the live exam. For this purpose, Skill Builder would be the best option. Please note, Skill Builder has also free practice exam with 20 questions. This is must for anybody taking preparing to take the exam. In case you are willing to pay, Skill Builder offers a fully-fledged practice exam with 85 questions. You will get explanation for the correct answer for each question.

On Udemy, Stephane is also selling a set of practice exams. I did feel the need to use purchase this, so I cannot provide a review on that.