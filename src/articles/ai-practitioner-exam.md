# My Experience with the AWS AI Practitioner (Beta) Exam

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

### 3. GenAI and AWS Services for GenAI

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

