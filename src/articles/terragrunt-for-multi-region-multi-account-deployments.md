# Terragrunt for Multi-Region/Multi-Account Deployments

Since a few years ago I've been working on for a company whose products are used by millions. It feels somewhat refreshing to know that the product to which you contribute is used by many people. In the other hand, it also comes with a lot of anxiety in cases when you have to make decisions, even though these decisions are usually made together with a team of other highly experienced individuals.

Such decision was the introduction of Terragrunt in our workflow. Why did we need Terragrunt, you may ask? This is what I will try to answer in the following lines of this article. Also, we will get technical and we will discuss about the "hows".

As a disclaimer, this article is subjective, based on my own experience in finding a solution for the the problems we had. Usually, there are more then one ways to tackle a problem and in many cases there are no perfect solutions. Knowing this, I think it is important to address the weaknesses and limitations of your solution, which this article will do later.

## What is Terragrunt?

Before going into the "whys", I think it is important to know what is Terragrunt. Now I won't give you their marketing points or any definition copied from sites like Wikipedia, I will try to explain what is the purpose of this tool from my point of view.

Essentially, Terragrunt is a wrapper around Terraform, acting as an orchestrator over multiple Terraform modules. As developers, we write have organize our Terraform code in [modules](https://developer.hashicorp.com/terraform/language/modules). Under to hood, each module gets embedded inside a Terraform project and it is deployed individually. Modules communicate between themselves with outputs and [dependency](https://terragrunt.gruntwork.io/docs/reference/config-blocks-and-attributes/#dependency) blocks, while the dependency tree and rollout our is determined by Terragrunt based on those blocks.

## Why Terragrunt?



## References:

1. [Terraform Modules](https://developer.hashicorp.com/terraform/language/modules)
1. [Terragrunt Dependency Blocs](https://terragrunt.gruntwork.io/docs/reference/config-blocks-and-attributes/#dependency)