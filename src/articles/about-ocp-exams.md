# About OCP Exams

## Intro

About two years ago I became Oracle Certified Java SE 11 Professional after successfully taking the 1Z0-819 exam. A few days ago I also became Java SE 17 certified after passing the 1Z0-829 exam. In the following lines I would like to talk about my experience with these certification exams. I would give also some insights about my preparation, what material I would recommend for having a successful exam and also I would like to talk about my personal opinions about the relevance of these kind of exams.

## What is an OCP Certification Exam?

Oracle Certified Professional (OCP) Java SE developer certifications are exams provided by Oracle which ment to test our Java knowledge. The exams follow a multiple choice format, which means we are presented with questions that have 4 or more answer options from which we have to select one or more. The question also specifies if only one option can be correct or we should select multiple options. In case we have to select multiple options, the question also says precisely how many options should we select for achieving full marks for the current question. Usually the questions are in the format of what would the output of the following code be (a code snippet is presented) or why does/doesn't compile the following code snippet. There can be also other type of questions, like fill in the correct line of code to achieve a certain result, or simply just answer a general Java question. What is expected that we can read and write Java code and we have general knowledge of how Java development works and what is happening under the JVM hood.

Oracle generally has an new OCP exam for each LTS (long-term supported) version of the Java platform. There is a whole discussion about what is considered an to be an LTS version for Java, moreover there are a bunch of other Java and JVM implementations provided by different vendors which can have a totally different LTS versioning strategy. In terms of OCP exams what we have to know is that each newer variant of it is based on a Java LTS version provided by Oracle, so we currently have exams for Java 8, Java 11 and Java 17.

### Wait, there are 3 different OCP exams?

Yeah, at the point of writing this article Oracle still offers the 1Z0-809 (Java 8) exam, the 1Z0-819 (Java 11) and the 1Z0-829 (Java 17) exams. There are few notable differences between them other than requiring knowledge about different versions of Java:
- 1Z0-809 exam (Oracle Certified Professional, Java SE 8 Programmer) is a 2 hours exam with a pre-requirement of already having passed the Oracle Certified Associate (OCA) - 1Z0-808 exam. Essentially, the material is split in twice, OCA testing on basic Java knowledge, OCP requiring the more advanced topics such as generics, streams, multithreading etc. Both exams have 68 questions, so they cover mainly every prescribed topic.
- 1Z0-819 exam (Oracle Certified Professional, Java SE 11 Programmer) in contrast with 1Z0-809, flips everything by merging the OCA and the OCP topics into a single exam. Moreover, the number of questions is reduced to 50 and the exam duration is also reduced to 90 minutes. Technically, on average, we have the same amount of time per question as we had for 1Z0-809, but for most of the people this exam will end up in a time crunch, making the exam itself really hard and stressful. As a sidenote, Oracle initially had the similar format for Java 17 with 1Z0-817 and 1Z0-818 exams, but these were discontinued.
- 1Z0-829 exam (Oracle Certified Professional, Java SE 17 Programmer) follows the same format as the previous 1Z0-819 exam. Changes were introduced mainly in the required material, having some newer Java features, but the exam itself feels very similar to the Java 11 one.

### Which one should I take?

This would have been a more interesting question a few years ago, when we had to choose between Java 8 and Java 11 exams. The format of the Java 8 exam is less intimidating, but it is more expensive, since we have to pay for 2 exams. Nowadays, Java 8 is reaching its end-of-life support (although the industry might say otherwise), and I feel that the exam will be discontinued in the near feature. I don't really recommend going for it. If we have to chose between 1Z0-819 and 1Z0-829, I suggest going with the later one. Both exams a really similar in format and in required knowledge, so I don't see compelling reason behind going withe the older one.

Regardless of what we chose to take, we should keep in mind that the core Java knowledge required is the same for all three exams. While the newer version emphasis the newer additions to the language, they also tend to leave behind some topics which are more than relevant. For example 1Z0-819 exam required advanced knowledge about Java annotations (which are widely used in the industry with popularity of Spring Boot and other frameworks), in the other hand 1Z0-829 dropped this topic entirely.

## What Learning Material Can We Use?



