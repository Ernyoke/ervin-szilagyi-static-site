# Terragrunt for Multi-Region/Multi-Account Deployments

Since a few years ago I've been working on for a company whose products are used by millions. It feels somewhat refreshing to know that the product to which you contribute is used by many people. In the other hand, it also comes with a lot of anxiety in cases when you have to make decisions, even though these decisions are usually made together with a team of other highly experienced individuals.

Such decision was the introduction of Terragrunt in our workflow. Why did we need Terragrunt, you may ask? This is what I will try to answer in the following lines of this article. Also, we will get technical and we will discuss about the "hows".

As a disclaimer, this article is subjective, based on my own experience in finding a solution for the the problems we had. Usually, there are more then one ways to tackle a problem and in many cases there are no perfect solutions. Knowing this, I think it is important to address the weaknesses and limitations of your solution, which this article will do later.

## What is Terragrunt?

Before going into the "whys", I think it is important to know what is Terragrunt. Now I won't give you their marketing points or any definition copied from sites like Wikipedia, I will try to explain what is the purpose of this tool from my point of view.

Essentially, Terragrunt is a wrapper around Terraform, acting as an orchestrator over multiple Terraform modules. As developers, we write have organize our Terraform code in [modules](https://developer.hashicorp.com/terraform/language/modules). Under to hood, each module gets embedded inside a Terraform project and it is deployed individually. Modules communicate between themselves with outputs and [dependency](https://terragrunt.gruntwork.io/docs/reference/config-blocks-and-attributes/#dependency) blocks, while the dependency tree and rollout our is determined by Terragrunt based on those blocks.

## Why Terragrunt?

To understand why Terragrunt was chosen, it would make sense to go through a little bit of history. 

Let's assume we have an application spanning through a few micro-services with a SQL database, some static assets and few ETL jobs bringing in some data from external providers. We decide we want to migrate everything to the AWS. Our users are from all over the globe, but our main focus is Europe and US. We have to offer different data to the EU users, so it makes to deploy the whole stack on 2 different regions. We also want to have the application deployed separately for development and testing, for which we can use different AWS accounts for security and compliance purposes.

For IaC we decide to use Terraform, because we have the most experience with that compare to other options. Having these in mind, the following events happened afterwards:

1. We started writing our Terraform code. We put everything in a singe Terraform project. We relied on `tfvars` files to have inputs for different environments and regions.
1. We shortly run into a scaling problem: attempting to do an apply went from a few minutes to a few tens of minutes. Moreover, we run into so communication and deployment issues in terms of certain changes being deployed to production before we wanted them.
1. Our Terraform project got bigger and bigger. We decide to slice it somehow pieces. We introduced the internal concept of "stacks" (this was well before the introduction of Terraform Cloud Stacks). A "stack" essentially is a Terraform project deploying a part of our infrastructure. Each stack could use resources deployed by other stacks by relying on Terraform outputs and [`terraform_remote_state`](https://developer.hashicorp.com/terraform/language/state/remote-state-data) or just by simply using data sources.
1. With the introduction of stacks we had different projects for networking, databases, ETL (we used mainly AWS Batch), storage (S3 buckets) and so on. This worked for a while until we run into another problem. At first it was easy to follow which stack depends on which other stack, but shortly we run into the issue of circular dependencies. Stack A could create resources used by stack B, while also relying on resources created by stack B. Obviously, this is bad, and at this point there is no entity to check and police our dependencies.
1. Moreover, we run into another problem. Certain resources are needed only for certain environments. For example, I need a read replica only for prod, for testing and development I can get by with the main database. At the beginning we can solve this with having conditions on weather we want to deploy the resource in the current environment. A certain point we notice that we have to place these conditions in many places, adding a lot of complexity baggage to our infrastructure code.
1. So we decided to introduce Terragrunt. 

To answer our initial question, we chose Terragrunt because:
- It solved the dependency hell we encountered. With Terragrunt we have to be explicit in defining on who does our current module depends.
- It fits the multi-region/multi-account approach. In case we dour our modules wisely, we use only the necessary modules for each region/environment. The caveat here is that we have to modularize our code and we do it adequately, which is might be not as easy as we would expect.
- By introducing versioning for our modules, we could evolve different environments at their own pace.

Now all of these come with a price: refactoring. Terragrunt relies on Terraform modules and our initial code was not as modular as one might expect. So we had to refactor a lot, which also came with an even bigger challenge: state management and transfering resources between state.


## References:

1. [Terraform Modules](https://developer.hashicorp.com/terraform/language/modules)
1. [Terragrunt Dependency Blocs](https://terragrunt.gruntwork.io/docs/reference/config-blocks-and-attributes/#dependency)
1. [The terraform_remote_state Data Source](https://developer.hashicorp.com/terraform/language/state/remote-state-data)