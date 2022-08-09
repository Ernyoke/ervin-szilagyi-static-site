# GCP Associate Cloud Engineer Certification Experience

## Intro

Today (9th of August, 2022) I took the Associate Cloud Engineer certification exam from Google. I'm writing this article to document my experience and to potentially give some advice to some other people who are planning to sit through this exam. This article reflects my own opinion about the exam itself, about requirements to pass the exam and about the online proctored exam process. I will talk about these in detail in the following lines, but as intro I have to say that I had a questionable experience.

## Motivation

Before talking about the exam, I feel the necessity to present my background. I feel like this is important in order for everyone to understand what I mean when I throw around some adjectives like "easy", "hard", "challenging", etc. What might be challenging for me, it might be a walk in the park for you, since your background matters when taking an exam based mostly on experience with a certain toolset.

Currently I am a platform engineer working for a big automotive company. I have a software engineering background, working as a professional developer from 2015. I worked on several projects for several clients using a wide range of technologies. In my current work I manage the infrastructure of a global product. I use AWS cloud on a daily basis at my work. I 6 times AWS certified (you can read about my experience here: [My Journey to become 5 times AWS Certified](https://ervinszilagyi.dev/articles/my-journey-to-become-5-times-aws-certified.html) and here: [Passed the Advanced Networking Specialty exam](https://www.reddit.com/r/AWSCertifications/comments/r9dcys/passed_the_advanced_networking_specialty_exam/), which means I have a bit of experience with taking certification exams. 

Before preparing for this exam, I never used Google Cloud Products at all. Obviously, I never had the chance to use them professionally at my work. My cloud experience relies mostly on AWS. What motivated me to invest time in a GCP certificate, was just pure curiosity and the will of knowing more. I'm not looking for a career change or a new job, I wont get a promotion for this. I just wanted to have an alternative view compared to my AWS experience.

## Preparation

I won't go into the details about what learning material is required for the Cloud Engineering certification. This can be found on the [official certification page](https://cloud.google.com/certification/cloud-engineer): What I will talk about is the material I've used to pass the exam:
- The official learning path provided by Google [https://cloud.google.com/training/cloud-infrastructure#cloud-engineer-learning-path](https://cloud.google.com/training/cloud-infrastructure#cloud-engineer-learning-path): This learning path consists of several introductory courses for Google Cloud Services. It also provides the ability to do labs (Qwiklabs) using temporary accounts created for Google Cloud. This can be very handy to get practical experience with GCP and to try out services without the fear of inquiring costs for our personal GCP account. The learning material provided by the courses is fine, but is not enough for being able to pass the exam, so we need to look elsewhere for other resources.
- Google Cloud Associate Cloud Engineer Course - Pass the Exam! course provided by freeCodeCamp and Antoni Tzavelas [https://www.youtube.com/watch?v=jpno8FSqpc8](https://www.youtube.com/watch?v=jpno8FSqpc8): this is a 20+ hour course provided for free and available on youtube. This was published while I was doing the courses from the official learning path and it became super handy. Since this is a free course on youtube, I don't know how much effort we put in keeping it up to date, since GCP can change a lot from one day to another. But for the near future, I would be one of the best materials out there.
- Dan Sullivan - Official Google Cloud Certified Associate [https://www.amazon.com/Google-Cloud-Certified-Associate-Engineer/dp/1119564417](https://www.amazon.com/Google-Cloud-Certified-Associate-Engineer/dp/1119564417): A book by Dan Sullivan for preparing the exam, which is good addition to the resources above. While the content of the book is great, I don't feel like it is enough by itself to pass the exam. If you have 30$ to spare for this book, go for it, otherwise just forget about it.

While learning I also did create my own notes and cheat sheets, which can be found on GitHub: [https://github.com/Ernyoke/certified-gcp-cloud-engineer](https://github.com/Ernyoke/certified-gcp-cloud-engineer). While this helped me remember certain things, I feel everyone should do their own notes to get the most value out of it. Nevertheless, I could help others as well to get an idea what is required to pass this certification.

## Practice Questions

Going through course materials and having hands-on experience with GCP is a must for passing the exam. What is also important, in my opinion, is having the necessary skills to deal with exam questions. The exam structure is multiple choice and multiple select type questions (I personally had only multiple select questions during my exam). In order to get some experience with similar type of questions, I recommend the following options:
- Sample questions by Google [https://docs.google.com/forms/d/e/1FAIpQLSfexWKtXT2OSFJ-obA4iT3GmzgiOCGvjrT9OfxilWC1yPtmfQ/viewform](https://docs.google.com/forms/d/e/1FAIpQLSfexWKtXT2OSFJ-obA4iT3GmzgiOCGvjrT9OfxilWC1yPtmfQ/viewform): a set of 20 sample questions from Google for free. Nothing to add here, just go and take them ;)
- TutorialDojo - Google Certified Associate Cloud Engineer Practice Exams [https://portal.tutorialsdojo.com/courses/google-certified-associate-cloud-engineer-practice-exams/](https://portal.tutorialsdojo.com/courses/google-certified-associate-cloud-engineer-practice-exams/): TutorialDojo provides the highest quality practice exams on the internet. This is also true for GCP cloud engineer certification, although some questions from the set might require some adjustments in order to be up to date. Nevertheless, for the the price of $15, this is the most representative set of questions we can get.
- Google Cloud Associate Cloud Engineer Practice Tests by Dan Sullivan
[https://www.udemy.com/course/google-cloud-associate-cloud-engineer-practice-examspractice-exams](https://www.udemy.com/course/google-cloud-associate-cloud-engineer-practice-examspractice-exams): another set of 100 questions (2 exams) which can be purchased for around 15$ on Udemy. The questions are ok, they are mostly based on the material from Dan Sullivan book. There are way too many questions asking for certain CLI commands. While the exam may ask you about CLI commands, these types of questions are not frequent, at least according to my experience.

## Thoughts about the Exam itself

The exam was challenging. It was certainly not the hardest certification exam I've taken, it does not even get close to the "AWS Certified Solutions Architect - Professional" exam, but it nevertheless is challenging. Most of the questions present a real life situation where you have to choose the most suitable option from the available ones. While it requires certain things to be memorized, I did not find that many hard factual questions during my exam.

Besides doing the exam preparation above, having certain working experience may help you tremendously. For example:

- Kubernetes experience or having previously taken CKAD, CKA exams: a high number of questions are k8s related, so having exposure this this technology can help you a lot;
- Experience with other cloud providers such as AWS, Azure: there is no standard which is followed by every provider. Nevertheless, not every provider will try to reinvent the wheel. A lot of skills from having work experience with AWS or Azure can carry over the GCP as well;
- General IT, administration or network engineering experience: Associate Cloud Engineer exam is an operations exam. Having exposure to basic IT procedures can help you a lot. Again, cloud itself does not try to reinvent the wheel all the time, it just adjusts existing procedures to this fancy environments, ultimately calling it "cloud".

## Online Proctoring is a Mess

I took several exams before the Associate Cloud Engineering exam. All my exams were done through online proctoring, using Pearson. While I had my fair-share of problems with them, they do not even come close to the mess which is called Kryterion. It is a standard procedure for now that in order to take an online proctored exam, you have to download their software which essentially takes over your whole computer for the time of exam. Whether we agree or not with this approach is beside the point, what is infuriating is that this tool will scan your PC/Mac and will tell you which processes you have to kill in order to proceed with the exam. This would be also fine if they could at least provide a list with these processes before the exam, but obviously they don't. You have around 30 minutes to go and clean your task manager according to their wish. I might add, some of the processes which need to be killed can not even be done from the task manager. For example, Windows 11 starts an Outlook process/service by default. In order to kill it, I had to search StackOverflow and SuperUser on the fly to get this CMD command which can kill it:

```
taskkill /F /IM HxOutlook.exe
```

Even if I managed to kill everything they requested, I was still struggling to start the damn exam. The tool was giving an "Invalid request" error and blocked my whole PC without being able to close it (remember, it takes your whole PC hostage). I had to manually reset my PC twice using the Power Button. While I was doing this, I had to contact support to ask them what the actual fuck is happening with their damn software. Ultimately, I think the issue was that I was using Chrome to start launching their proctoring tool, which on the other hand tried to kill Chrome but it couldn't (LOL). I managed to launch my exam at the last minute using Firefox. So yeah...no further comments needed.

## Everything Else

Other useful resources about the exam can be found in this GitHub repo: [sathishvj/awesome-gcp-certifications](https://github.com/sathishvj/awesome-gcp-certifications/blob/master/associate-cloud-engineer.md)

After finishing the exam, the proctoring tool gives you a PASS/FAILED result. This also will have to be confirmed by Google, which can take up to 7-10 days.


## Links and References

1. Associate Cloud Engineer: [https://cloud.google.com/certification/cloud-engineer](https://cloud.google.com/certification/cloud-engineer)
2. Cloud Engineer learning path: [https://cloud.google.com/training/cloud-infrastructure#cloud-engineer-learning-path](https://cloud.google.com/training/cloud-infrastructure#cloud-engineer-learning-path)
3. Google Cloud Associate Cloud Engineer Course - Pass the Exam! by Antoni Tzavelas: [https://www.youtube.com/watch?v=jpno8FSqpc8](https://www.youtube.com/watch?v=jpno8FSqpc8)
4. Sample Questions: [https://docs.google.com/forms/d/e/1FAIpQLSfexWKtXT2OSFJ-obA4iT3GmzgiOCGvjrT9OfxilWC1yPtmfQ/viewform](https://docs.google.com/forms/d/e/1FAIpQLSfexWKtXT2OSFJ-obA4iT3GmzgiOCGvjrT9OfxilWC1yPtmfQ/viewform)
5. TutorialDojo - Google Certified Associate Cloud Engineer Practice Exams: [https://portal.tutorialsdojo.com/courses/google-certified-associate-cloud-engineer-practice-exams/](https://portal.tutorialsdojo.com/courses/google-certified-associate-cloud-engineer-practice-exams/)
6. Google Cloud Associate Cloud Engineer Practice Tests by Dan Sullivan [https://www.udemy.com/course/google-cloud-associate-cloud-engineer-practice-examspractice-exams](https://www.udemy.com/course/google-cloud-associate-cloud-engineer-practice-examspractice-exams)
7. sathishvj/awesome-gcp-certifications [https://github.com/sathishvj/awesome-gcp-certifications/blob/master/associate-cloud-engineer.md](https://github.com/sathishvj/awesome-gcp-certifications/blob/master/associate-cloud-engineer.md)
8. My GCP Associate Cloud Engineer Notes: [https://github.com/Ernyoke/certified-gcp-cloud-engineer](https://github.com/Ernyoke/certified-gcp-cloud-engineer)