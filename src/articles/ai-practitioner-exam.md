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
- Neural Networks: what are neural networks? Also, you should know about their components:
    - Neurons
    - Layers
    - Activation functions
    - Loss functions
- You should understand what backpropagation is: the process of updating the weights in the network to minimize the loss function
- Deep Learning: understand what it is and for what is used. Remember the keyword **convolution**, it is used for a type of deep learning networks (named convolutional networks) of which main use cases are computer vision and image recognitions
- GenAI: what is generative AI and what is it used for?
- Transformer Models/Diffusion Models/Multi-Modal Models: these are "GenAI" models. There is a high change the you will see some questions asking about some property of these models, so you should have a surface level knowledge about them. Other then that, you probably wont need to go into details about their inner working.
- Supervised vs. Unsupervised learning: you should know the difference between them and you should know when is better to use one or another

