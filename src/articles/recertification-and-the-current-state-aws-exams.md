# Recertification and the Current State of AWS Exams

Three years ago I wrote one of my first blog posts titled "[My Journey to become 5 times AWS Certified](https://ervinszilagyi.dev/articles/my-journey-to-become-5-times-aws-certified.html)". This was right after I received my badge for the Solutions Architect Professional certification. I was happy and relieved back then after I successfully passed one of the most challenging exams.

The unfortunate thing about AWS exams is that they have an expiration date. They are valid for 3 years, after which you either have to recertify or you just accept that your certification has expired and you move on with your life. Recertification means you will have to sit through the same exams all over again. If you go for the professional exams and successfully pass them, the associate exams will be automatically renewed, hence it was enough for me to go for both the Devops Professional and Solutions Architect Professional exams to have all of my 5 badges active.

## Preparation

For the preparation, I used the same resources I was using 3 years ago. For the DevOps exam, back then I purchased Stephane Maarek's course from Udemy, based on which I wrote my notes back then, which I planned to reuse. The problem with this course is that it was entirely re-shot by Stephane. Admittedly, a lot of topics have changed. There is a new version of this exam, DOP-C02, which requires knowledge of a set of new AWS services such as Security Hub, Control Tower, Network Firewall, etc. At the same time, AWS tends to introduce updates and new features for most of its offerings. I decided to re-watch the whole course content again, while also skimming over certain lessons, and I did not do any practical exercise. I work with AWS daily, I did not feel the need to do any of those.

For the Solutions Architect Professional exam back then I purchased the course from Adrian Cantril. In contrast, this course remained roughly the same as 3 years ago, with additional updates where it was needed. The Direct Connect portion, for example, received a major overhaul. Adrian added all the DX content from the Advanced Networking course to the Solutions Architect Professional course. Unfortunately, there is some legacy leftover content, which was required for the previous version of the exam, but it is simply not needed anymore. Services such as Server Migration Service or Simple Workflow Service are not in scope anymore for the exam.

To put in contrast these courses, I find it difficult to recommend the course from Stephane as the sole source of preparation. Admittedly, Stephane himself recommends going through his courses from the associate exams before going for the professional ones. The DevOps exam really dropped the ball in terms of difficulty, and I think the course material is not detailed enough for the exam. Adrian's course, on the other hand, is very lengthy with lots of practice examples. While this course covers most of the necessary topics for the exam, it still has some things missing (and some unnecessary stuff, as stated before). I'm confident there will be updates and more with more topics. As guidance, for both of the exams, I strongly recommend downloading the exam guides (can be found [here](https://d1.awsstatic.com/training-and-certification/docs-sa-pro/AWS-Certified-Solutions-Architect-Professional_Exam-Guide.pdf) for the SAP and [here](https://d1.awsstatic.com/training-and-certification/docs-devops-pro/AWS-Certified-DevOps-Engineer-Professional_Exam-Guide.pdf) for the DOP) and going through the Appendix part with the list of services. You should at least be able to identify the purpose of each service in case you are seeing them in questions and answer choices. In-depth knowledge of some services is more important for each exam, but for many other things, it is enough to mainly know what is used.

In terms of practice questions, I've used the ones from TutorialDojo and also the ones from Digital Cloud Training. As with the courses, I did my preparation with the same question sets 3 years ago, but I was not able to recall any of those questions from back then. These question sets are good, but unfortunately, they start to show their age, specifically those from TutorialDojo. 

The DevOps question set from either of these vendors does not reflect the difficulty that you will face in the exam. In my case, probably, I was unlucky or something, but the questions I got in the exam were way more challenging than expected. Many of them were mainly focused on AWS Organizations, Control Tower, Security Hub, and other newer features. These services are barely covered in the question sets from TutorialDojo and Digital Cloud Training. 

The Solutions Architect Professional question set is a bit better in the case of Tutorial Dojo, the one from Digital Cloud is fantastic, to the point that for certain questions in the live exam, you will have a deja-vu feeling.

A more representative practice exam comes straight from AWS on their SkillBuilder site. Sadly, the question set contains only 20 questions, but at least it is for free. AWS offers these practice questions for each of their certifications, so I strongly recommend going through the ones for your exam.

## Exam Experience

I took the DevOps exam in May, after which I took the Solutions Architect Professional in August. To begin with my experience with the DevOps exam, I must confess, that I had a rough time. I was aware of the fact that there was a new version of this exam around a year ago, but I did not think it would be so much different than the previous one.

In my opinion, the exam become way more challenging. For my test case, most of the questions were wordy and lengthy, many of which were multiple selections. I understand that this is what we should expect from a professional-level exam, but I felt that this exam was crossing a threshold and was testing my sanity instead of my knowledge. Usually, I don't even bother about the clock, I tend to be fast enough to finish in time, but in this case, I had to use all the time I had. 

For the types of questions, I had all the usual CICD and cloud automation-related problems, stuff you might expect. Aside from that, I had way too many questions about AWS Organizations and Control Tower. In fact, at some point, I was rolling my eyes while encountering another AWS Organizations question. Other significant services touched were the following: Security Hub, AWS Config, AWS Lambda, S3 (I had a question about S3 Object Lambda as well), Storage Gateway, and FSx (I got 2 questions which touched FSx for NetApp, topic which is not covered by any tutor at the point of writing this article), EventBridge, CloudWatch (Logs, Dashboards, Synthetics), and many other stuff I don't remember.

Aside from this, there were some borderline infuriating questions. To provide an example, the exam expected me to know what kind of condition should (or should not) accept a certain action from a bucket policy or what exactly a certain AWS Config rule (more specifically it expected me to know if there is a Config rule for a certain thing). Memorizing such things is a waste of time in my opinion, and I think it proves basically nothing.

Continuing with the Solutions Architect Professional exam, most of the things I was asked were in the realm of what I had expected. Even though this exam essentially throws every AWS product at you, you only need in-depth experience with a handful of services. 

Nevertheless, it is a challenging exam, and it can have some surprises. For example, I had a question involving Lambda SnapStart. SnapStart is a new feature used to improve cold starts for Lambdas developed in Java. I was closely monitoring this functionality when it was released by AWS since I am a Java developer at heart. Back then, I did not consider it as revolutionary as AWS was advertising it. As a tangent, in my opinion, if you want fast cold starts you either go for GraalVM or just simply drop Java and write your Lambda in anything else. A native option such as Rust (no fanboy, I'm just stating [facts](https://maxday.github.io/lambda-perf/)) would offer way better cold starts.

Anyway, aside from SnapStart, most of the questions were okay. In some cases, the wording was abysmal for either the questions or the answer options, but I'm not a native English speaker, so I won't complain. A few services I would like to mention here for which I encountered multiple questions: networking and DX, IoT (IoT Core, Greengrass, and some other obscure IoT service, you should know about each of them anyway), containers (ECS, Kubernetes - I had one question where Kubernetes made the most sense), streaming services (Kineses Streams and Firehose, AWS MSK in one question only), big data and data engineering (Redshift, Glue, EMR, Athena) and many other.

## Is it Worth to get (Re)Certified?

Is it worth getting recertified? 

As cliche as it sounds, it depends. I tend to believe it was worth it for me. I wanted to maintain the status of having active certifications in my current workplace. Also, I wanted to be up to date with the latest changes in AWS.

Will it be worth it for you? I don't know.

In case you are reading this article before having any certification, a more important question for you would be if it is worth getting certified.

If you stumbled on this blog post just before your exam, you must know that you did not waste your time and money. You acquired useful knowledge that you will be able to apply even outside of the AWS cloud.

On the other hand, if you are still considering an AWS certification, any type of AWS certification, you may take into consideration the following as well:
- You are being tested on a volatile technology. This means that there are a lot of changes happening for many of the AWS products while you are doing your preparation. AWS constantly releases upgrades to products, making them more usable with more features and this is a good thing. From a certification perspective, however, these new upgrades are not introduced right away in the required curriculum. What might happen is that your knowledge might be outdated at the moment you get your certification badge. 
- Admittedly, even if certain updates are rolled out and you do not learn about those, is not the end of the world. Similarly, in the ballpark of volatility, AWS can retire services. Unfortunately, this has happened more often lately. For example: ![Jeff Bar Tweet about retiring AWS products](img-recertification-and-the-current-state-aws-exams/jeff-bar-tweet.png)
Most of these AWS products are part of the currently required learning material for certifications. In fact, CodeCommit is a pivotal part of the DevOps exam. Aside from these services, other services were sunset such as OpsWorks, Server Migration Service, Snowmobile, and others which I cannot remember. The thing is that these are products about which the exam expects in-depth knowledge, but this knowledge becomes outdated right away. I understand that what you are learning might be carried over to alternative solutions, but many of those are not drop-in replacements.
- The next point might apply to some specialized exams focusing on certain areas of AWS, such as the DevOps exam. You may not benefit as much from what you are learning. Your workplace might use alternative tools, or your role might not correspond with how AWS envisions it. To give you an example, I worked as a DevOps/Platform Engineer in the past. We were using AWS for the infrastructure. We were using Terraform for IaC code, we did not touch CloudFormation at all. We were not using SAM for Lambda functions, Terraform could deploy Lambda functions more cleanly without all the baggage of a Serverless Application. We were working for a huge organization, meaning that account creation and managing the AWS Organizations was the role of an entirely different team. AWS Config rules were managed by the security team, an entirely different department. For CICD we were using GitHub with GitHub Actions. As you can see, we are diverging more and more compared to how AWS saw a DevOps engineer. They have all the right to ask questions about their services, and I strongly believe that all the CloudFormation and CodeCommit/CodeBuild/CodeDeploy questions have their place in the exam. Ultimately, my point is that I'm not the DevOps engineer that the exam portrays, and this certification might not be as beneficial for my short-term career. This might apply to you as well.

## Will the Certifications Help Me Get a Job?

During my career, I've seen a handful of job descriptions having a certification as a requirement. They do exist, but in most of the cases, the hiring company does not care about certification. Also, I did not see any job description explicitly mentioning that it needs an active certificate from a candidate. As long as your certificate is relatively recent, you probably should be fine regardless if it is still active or not. And probably, nobody will care anyway if you have hands-on experience.

Will a certificate help me get a job?

It might help you get noticed or jump the queue in certain cases. But that's all about it, or at least this is what I experienced. You will still have to pass the interview after that, no certification will give you an automatic pass.

## TLDR

I recently got recertified. I took both the **AWS Certified DevOps Engineer - Professional (DOP-C02)** and the **AWS Certified Solutions Architect - Professional (SAP-C02)** exams. Here are the resources I used:

### AWS Certified DevOps Engineer - Professional (DOP-C02):

| Learning Material | Type | Free or Paid | Additional Comments |
|-------------------|------|--------------|---------------------|
| [Stephane Maarek - AWS Certified DevOps Engineer Professional - Udemy Course](https://www.udemy.com/course/aws-certified-devops-engineer-professional-hands-on) | Video content | Paid | I recommend only if you did Stephane's associate level Udemy Courses |
| [TutorialDojo practice exams](https://portal.tutorialsdojo.com/courses/aws-certified-devops-engineer-professional-practice-exams) | Practice Questions | Paid | They are good, but they are starting to show their age |
| [Exam Prep Official Practice Question Set](https://explore.skillbuilder.aws/learn/course/external/view/elearning/14673/aws-certified-devops-engineer-professional-official-practice-question-set-dop-c02-english) | Practice Questions | Free | Strongly recommend doing these questions, sadly the set contains only 20 of them |
| [Digital Cloud Training practice exams](https://learn.digitalcloud.training/course/aws-certified-devops-engineer-practice-exams) | Practice Questions | Paid | They are similar to TutorialDojo questions |

My notes can be found here: [https://github.com/Ernyoke/certified-aws-devops-professional](https://github.com/Ernyoke/certified-aws-devops-professional)

### AWS Certified Solutions Architect - Professional (SAP-C02):

| Learning Material | Type | Free or Paid | Additional Comments |
|-------------------|------|--------------|---------------------|
| [AWS Certified Solutions Architect - Professional - Adrian Cantrill](https://learn.cantrill.io/) | Video content | Paid | It is a lengthy 60+ hours course. I recommend it if you can afford the higher price |
| [TutorialDojo practice exams](https://portal.tutorialsdojo.com/courses/aws-certified-solutions-architect-professional-practice-exams/) | Practice Questions | Paid | They are good, but they are starting to show their age |
| [Exam Prep Official Practice Question Set](https://explore.skillbuilder.aws/learn/course/external/view/elearning/13270/aws-certified-solutions-architect-professional-official-practice-question-set-sap-c02-english) | Practice Questions | Free | Strongly recommend doing these questions, sadly the set contains only 20 of them |
| [Digital Cloud Training practice exams](https://learn.digitalcloud.training/course/aws-certified-solutions-architect-professional-practice-exams) | Practice Questions | Paid | They are really good and they manage to be very similar to what you will get on the exam |

My notes can be found here: [https://github.com/Ernyoke/certified-aws-solutions-architect-professional](https://github.com/Ernyoke/certified-aws-solutions-architect-professional)