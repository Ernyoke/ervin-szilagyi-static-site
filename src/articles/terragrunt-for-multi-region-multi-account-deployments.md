# Terragrunt for Multi-Region/Multi-Account Deployments

Since a few years ago I've been working for a company whose products are used by millions. It feels somewhat refreshing to know that my contributions have an impact on the daily lives of so many people. On the other hand, this work also comes with a lot of anxiety in cases when you have to make decisions, even though these decisions are usually made together with a team of other highly experienced individuals.

Such a decision was the introduction of Terragrunt in our workflow. Why did we need Terragrunt, you may ask? This is what I will try to answer in the following lines of this article.

As a disclaimer, this article is subjective, based on my own experience in finding a solution to the problems we had. Usually, there is more than one way to tackle a challenge and in many cases, there are no perfect solutions. Knowing this, I think it is important to address the weaknesses and limitations of your solution, which this article will do later.

## What is Terragrunt?

Before going into the "whys", I think it is important to know what is Terragrunt. Now I won't give you their marketing points or any definition copied from sites like Wikipedia, I will try to explain what is the purpose of this tool from my point of view.

Essentially, Terragrunt is a wrapper around Terraform, acting as an orchestrator over multiple Terraform modules. As developers, we have to organize our Terraform code in [modules](https://developer.hashicorp.com/terraform/language/modules). Under to hood, each module gets embedded inside a Terraform project and it is deployed individually. Modules communicate between themselves with outputs and [dependency](https://terragrunt.gruntwork.io/docs/reference/config-blocks-and-attributes/#dependency) blocks, while the dependency tree and rollout order are determined by Terragrunt.

## Why Terragrunt?

To understand why Terragrunt was chosen, it would make sense to go through a timeline of challenges we encountered.

Let's assume we have an application spanning through a few micro-services with an SQL database, some static assets, and a few ETL jobs bringing in some data from external providers. We decide we want to migrate everything to the AWS. Our users are from all over the globe, but our main focus is Europe and the US. We have to offer different data to the EU users and the US users, moreover, we would like to reduce the latency of the responses. So it makes sense to deploy the whole stack on 2 different regions. We also want to have the application deployed separately for development and testing, for which we can use different AWS accounts.

For IaC we decided to use Terraform because we have the most experience with that compared to other options. Having these in mind, the following events happened afterward:

1. We started writing our Terraform code. We put everything in a single Terraform project. We relied on `tfvars` files to have inputs for different environments and regions.
1. We shortly ran into a scaling problem: attempting to do an `apply` went from a few minutes to a few tens of minutes. Moreover, we run into so communication and deployment issues in terms of certain changes being deployed to production before we wanted them.
1. Our Terraform project got bigger and bigger. We decide to slice it somehow into smaller pieces. We introduced the internal concept of "stacks" (this was well before the introduction of Terraform Cloud Stacks). From our point of view, a "stack" essentially was a Terraform project deploying a well-defined part of our infrastructure. Each stack could use resources deployed by other stacks by relying on Terraform outputs and [`terraform_remote_state`](https://developer.hashicorp.com/terraform/language/state/remote-state-data) or just by simply using data sources.
1. With the introduction of stacks we had different projects for networking, databases, ETL (we used mainly AWS Batch), storage (S3 buckets), and so on. This worked for a while until we ran into another problem. At first, it was easy to follow which stack depends on which other stack, but shortly we ran into the issue of circular dependencies. Stack A could create resources used by stack B, while also relying on resources created by stack B. Obviously, this is bad, and at this point, there is no entity to check and police our dependencies.
1. Moreover, we run into another problem. Certain resources are needed only for certain environments. For example, I need a read replica only for prod, for testing and development I can get by with only the main database. In the beginning, we could solve this by having conditions on whether we want to deploy the resource in the current environment or not. At a certain point, we notice that we have to place these conditions in many places, adding a lot of complexity baggage to our infrastructure code.
1. So we decided to introduce Terragrunt.

To answer the initial question, we chose Terragrunt because:
- It solved the dependency hell we encountered. With Terragrunt we have to be explicit in defining on who our current module depends.
- It fits the multi-region/multi-account approach. In case we dour our modules wisely, we use only the necessary modules for each region/environment. The catch here is that we have to modularize our code and we do it adequately, which might be not as easy as we would expect.
- By introducing versioning for our modules, we could evolve different environments at their own pace.

Now, all of these come with a price: refactoring. Terragrunt relies on Terraform modules. Our initial code was not as modular as we might expect. So we had to do a lot of refactoring, which also came with an even bigger challenge: state management and transferring resources between states.

## How does Terragrunt Work?

To use Terragrunt, first, we have to be comfortable with [Terraform modules](https://developer.hashicorp.com/terraform/language/modules). The concept of modularization is simple:

- Terraform provides building blocks such as resources and data sources;
- Some of these resources are often used together (for example: a database and Route 53 record for its hostname)
- It would make sense to group these resources in a reusable container. These reusable containers are called modules.

Modules can communicate between themselves with inputs and outputs. Terragrunt requires that all of our Terraform resources be part of modules.

### Setting Up a Terragrunt Project

In the official Terragrunt documentation there is [a good article](https://terragrunt.gruntwork.io/docs/features/keep-your-terraform-code-dry/) about how to set up a Terragrunt project and where to place modules. In fact, there is also a [repository](https://github.com/gruntwork-io/terragrunt-infrastructure-live-example) on GitHub providing an example project on how the creators recommend setting up Terragrunt. I certainly recommend going through that repository, because it is a good reference for a starting point. Having that said, I like to structure mine a little bit differently. My recommendation is to have different AWS accounts for each environment. Getting a new account usually is relatively easy to accomplish even if we are working in a corporate environment (your workplace most likely is using AWS Organizations to manage accounts). The existence of multiple accounts does not require additional costs, we only pay for what we use.

In the [terragrunt-infrastructure-live-example](https://github.com/gruntwork-io/terragrunt-infrastructure-live-example) the split for the environments is done by **prod** and **non-prod** accounts. Each of these is further split by region. The **non-prod** account is also used for **qa** and **stage** environments. This setup can be perfectly acceptable, the one downside being that we will have to think about a naming convention for our resources, since in **non-prod** we will have the same cloud resources for both **qa** and **stage**. While this is not that big of a deal, I prefer to have one environment per account. My proposal for a Terragrunt project setup would look like this (GitHub repository for this example project can be found here: [https://github.com/Ernyoke/tg-multi-account](https://github.com/Ernyoke/tg-multi-account)):

```bash
tg-multi-account
│   .gitignore
│   global.hcl
│   terragrunt.hcl
│
├───dev
│   │   account.hcl
│   │
│   └───us-east-1
│       │   region.hcl
│       │
│       ├───alb
│       │       terragrunt.hcl
│       │
│       ├───ecs-cluster
│       │       terragrunt.hcl
│       │
│       ├───ecs-services
│       │   └───frontend
│       │           terragrunt.hcl
│       │
│       └───vpc
│               terragrunt.hcl
│
├───prod
│   │   account.hcl
│   │
│   ├───eu-west-1
│   │   │   region.hcl
│   │   │
│   │   ├───alb
│   │   │       terragrunt.hcl
│   │   │
│   │   ├───ecs-cluster
│   │   │       terragrunt.hcl
│   │   │
│   │   ├───ecs-services
│   │   │   └───frontend
│   │   │           terragrunt.hcl
│   │   │
│   │   └───vpc
│   │           terragrunt.hcl
│   │
│   └───us-east-1
│       │   region.hcl
│       │
│       ├───alb
│       │       terragrunt.hcl
│       │
│       ├───ecs-cluster
│       │       terragrunt.hcl
│       │
│       ├───ecs-services
│       │   └───frontend
│       │           terragrunt.hcl
│       │
│       └───vpc
│               terragrunt.hcl
│
├───qa
│   │   account.hcl
│   │
│   ├───eu-west-1
│   │   │   region.hcl
│   │   │
│   │   ├───alb
│   │   │       terragrunt.hcl
│   │   │
│   │   ├───ecs-cluster
│   │   │       terragrunt.hcl
│   │   │
│   │   ├───ecs-services
│   │   │   └───frontend
│   │   │           terragrunt.hcl
│   │   │
│   │   └───vpc
│   │           terragrunt.hcl
│   │
│   └───us-east-1
│       │   region.hcl
│       │
│       ├───alb
│       │       terragrunt.hcl
│       │
│       ├───ecs-cluster
│       │       terragrunt.hcl
│       │
│       ├───ecs-services
│       │   └───frontend
│       │           terragrunt.hcl
│       │
│       └───vpc
│               terragrunt.hcl
│
└───_env
        frontend.hcl
        vpc.hcl
```

Here we have 3 environments: **dev**, **qa**, and **prod**. Each environment should be living in a single AWS account. The root of the project contains configuration (`locals`) shared by every environment. If we go inside a directory acting as an environment/account, we have the account-specific properties (`account.hcl`). We also create directories here for each region in which we would want to provision things. Navigating one step deeper we find the region-specific configuration (`region.hcl`) and all the modules we would like to have in that region.

Now let's focus on the Terragrunt modules. If we open a configuration, for example for the VPC, a possible implementation would be the following:

```hcl
terraform {
  source = "tfr:///terraform-aws-modules/vpc/aws//.?version=5.8.1"
}

include "root" {
  path = find_in_parent_folders()
}

locals {
  global_vars = read_terragrunt_config(find_in_parent_folders("global.hcl"))

  project_name = local.global_vars.locals.project_name
}

inputs = {
  name = "${local.project_name}-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway = true
  enable_vpn_gateway = false
}
```

To give a short explanation of what we have here:

- In the `terraform` block we have to specify a path to a Terraform module. For example, in this case, we use the VPC module from the [terraform-aws-modules](https://github.com/terraform-aws-modules/terraform-aws-vpc) open source project for which we either could use the URL of the repository, or we could use the URL provided by the Terragrunt registry. We don't necessarily need to rely on other people's code, we can use modules maintained by ourselves by providing a link to our remote Git repository, or we can even have it point to a local path on our drive.
- The `include` block is optional. It is used for "inheritance". By inheritance, we can think of it as if the parent configuration file is copy/pasted in the current configuration file. This can be useful because we can share common inputs with other environments/regions. Including them in the current configuration, Terragrunt will automatically provide them to the Terraform module. Also, we have the ability to append/override certain inputs as we wish.
- The `locals` block essentially acts the same as Terraform `locals`. These are local "variables" used in the current configuration. We can also read locals from other configuration files with Terragrunt functions (`read_terragrunt_config`).
- The `inputs` are values we provide to the Terraform module. If we use inheritance, the includes provided by the parent configuration are automatically merged with current includes, making our configuration [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself), arguably less readable, more on this later.

Taking the "DRY" -ness a step further, we can notice that modules such as `vpc` are used in each environment/region with little configurational difference. What we can do is extract this configuration into a top-level folder, such as `_env`, and rely on the inheritance feature discussed before.

The extracted file will look like this:

```hcl
# ./_env/vpc.hcl

terraform {
  source = "tfr:///terraform-aws-modules/vpc/aws//.?version=5.8.1"
}

locals {
  global_vars = read_terragrunt_config(find_in_parent_folders("global.hcl"))

  project_name = local.global_vars.locals.project_name
}

inputs = {
  name = "${local.project_name}-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway = true
  enable_vpn_gateway = false
}
```

In case our region is not from us-east-1, we can override the availability zones with sensible ones:

```hcl
# ./qa/eu-west-1/vpc/terragrunt.hcl

include "root" {
  path = find_in_parent_folders()
}

include "env" {
  path = "${get_terragrunt_dir()}/../../_env/vpc.hcl"
}

inputs = {
  azs  = ["eu-west-1a", "eu-west-1b", "eu-west-1c"]
}
```

More or less this is what we need to know to be able to write Terragrunt code. Now let's discuss deployments.

### Deployments

The deployment of a Terragrunt project can be accomplished with the following command:

```bash
terragrunt run-all apply
```

If we run this command from the root our our project, Terragrunt will attempt to deploy all the resources in all the accounts. This assumes we have the necessary rights to deploy to each account and we also made sure that Terragrunt knows about the IAM role it can assume to do the provisioning (see: [`iam_role`](https://terragrunt.gruntwork.io/docs/reference/config-blocks-and-attributes/#iam_role)).

**LATER UPDATE**: It seems like it is not really possible to execute `run-all apply` from the root of the project in this current example. Terragrunt will fail to find either `globals.hcl` or `account.hcl`. It appears strange to be unable to find `globals.hcl`, but it is understandable to not be able to locate `account.hcl`, since this file is not in a parent folder. It was an oversight on my part while building the example project for this article and I apologize for that. Deploying from an environment should work as it is presented in the upcoming lines.

In case we don't want to deploy everything everywhere at once, we can simply navigate into the folder of the environment/region where we want to provision resources, and we can execute the command there.

In case we want to deploy certain modules only in a certain region, we can navigate into the folder for that module and execute the command there. An important thing to note here, if we run `terragrunt run-all apply` for a module, all the dependencies of that module will also be deployed. This might be time-consuming in cases where we need to execute it frequently (in case we do development for example). As a workaround, we can run `terragrunt apply` instead (without the `run-all` command). This will omit to roll out all the dependencies. It will rely on previous outputs cached with previous deployments. If there was no previous deployment for a dependency, the command will fail.

Terragrunt commands are similar to what we've been accustomed to while using Terraform. We can see the plan by executing the `plan` command (with certain limitations, more about this below), we can import resources with the `import` command, we can `force-unlock` the state of a module in case it got stuck with an unsuccessful apply, and so on.

## Downsides and Limitations

Like every other tool, Terragrunt has its limitations, especially if we are coming from a Terraform setup. While I consider Terragrunt to be a valuable and useful tool, I think is very important to know its limitations in case we consider adopting it.

The following is a list of challenges that I've encountered during its adoption and day-to-day usage. I imagine there are plenty of others faced by other people, this is not an exhaustive list.

1. **Steep learning curve and complexity of usage**: if we are new to Terragrunt, we may get easily overwhelmed by all the new concepts we are introduced to. As we get more familiar with it, we are faced with other challenges, such as configuration inheritance. Having to adhere to practices that make our configuration DRY, can also make it more challenging to understand and follow.

2. **There `plan` command is broken (at least in certain scenarios)**: this is stated even in the documentation for the [`run-all` command](https://terragrunt.gruntwork.io/docs/reference/cli-options/#run-all)

> [WARNING] Using `run-all` with `plan` is currently broken for certain use cases. If you have a stack of Terragrunt modules with dependencies between them—either via dependency blocks or `terraform_remote_state` data sources—and you’ve never deployed them, then `run-all plan` will fail as it will not be possible to resolve the dependency blocks or `terraform_remote_state` data sources!

This might seem a non-issue at first, but if we consider also to following note for the `apply` command...

> [NOTE] Using `run-all` with apply or destroy silently adds the `-auto-approve` flag to the command line arguments passed to Terraform due to issues with shared stdin making individual approvals impossible.

...we can probably guess why it might be dangerous to simply do deployments. Although, it might not be such drastic of a situation. My recommendation is that if we have doubts, we should restrict roll-outs to individual modules. In the case of modules, we can execute `plan` or `apply` without the silent auto-approve flag.

Also, Terragrunt is meant to be used with multiple environments in mind. Having a successful rollout in a non-prod environment should make us confident and prepared for the production rollout.

3. **There is no easy way to import Terraform resources (at least I'm not aware of any)**: in case we have a Terraform project and we decide to transform it to Terragrunt, we most likely will have to manually import all the resources into the new state. This might be a non-issue if we could destroy our Terraform stack and re-provision everything with Terragrunt, but this might not be possible in the case of a production environment where availability is important.

4. **Deployment Speed**: Terragrunt is running Terraform under the hood. It will invoke Terraform independently for each module, an action that takes time. A mitigation for this is to keep deployments scoped to and apply only what we need. In cases where we need a plan for the whole project (for a security assessment for example), most likely we will still have to wait a lot to get that.

## Alternatives to Terragrunt

At the beginning of this article, we have seen why Terragrunt made sense for us for a business-critical solution. In the previous section, we were also faced with the limitations of this tool. Having in mind all of these, we could want to keep an eye on what other alternatives exist.

Here are a few examples that can be considered instead of Terragrunt.

1. [Terramate](https://github.com/terramate-io/terramate): It seems like a good alternative, and I think it could have been a better choice for certain issues we had. With Terramate the transition from Terraform might have been easier since Terraform projects can be imported seamlessly. Furthermore, we don't have to think right away about how to modularize everything. The reason it was not chosen, is that my team was mainly familiar with Terragrunt. We had no experience with Terramate, so we decided to play it safely.
2. [Terraform Stacks](https://www.hashicorp.com/blog/terraform-stacks-explained): at the point of writing this post, it is still not generally available. It was not even considered by us back then, since it was in private preview and nobody had access to it. It might be a good choice in the future, but for now, it is not something we can use.
3. [Terraform Workspaces](https://developer.hashicorp.com/terraform/language/state/workspaces): they are a similar approach to having different tfvars files per environment/region, a solution we were extensively using. We found that it is not the best choice since it scales poorly if the infrastructure gets bigger and bigger. However, If you start a project, I still recommend sticking to workspaces at the beginning and moving to something afterward, when it is needed.
4. Insert any other tool here: understandably there are many other options out there.  When making a decision for something that will have to be maintained by multiple people for a living, usually we go with the one tool that has to most support on the internet, it is known by most of the people from the team and generally has a good reputation.

## Final Thoughts
In conclusion, Terragrunt is a powerful tool with many functionalities. It is an opinionated way of working with infrastructure. It might not be the best choice for everyone.

Should I use it for my next project?
It depends. If you did not encounter some of the issues that are aimed to be solved by it, then you probably may not want to use it. It will add considerable maintenance baggage. To quote the Terragrunt author here [[source]](https://www.reddit.com/r/Terraform/comments/15242e4/comment/jsmoedj/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button):

> If you're working on a small project (e.g., a solo project or hobby), none of this matters, and you probably don't need Terragrunt. But if you're working at a company that is using Terraform to manage infrastructure for multiple teams and multiple environments, the items above make it hard to create code that is maintainable and understandable, and that's where Terragrunt can be a great option.

## References:

1. [Terraform Modules](https://developer.hashicorp.com/terraform/language/modules)
1. [Terragrunt Dependency Blocs](https://terragrunt.gruntwork.io/docs/reference/config-blocks-and-attributes/#dependency)
1. [The terraform_remote_state Data Source](https://developer.hashicorp.com/terraform/language/state/remote-state-data)
1. [Keep your Terraform code DRY](https://terragrunt.gruntwork.io/docs/features/keep-your-terraform-code-dry/)
1. [`iam_role`](https://terragrunt.gruntwork.io/docs/reference/config-blocks-and-attributes/#iam_role)
1. [`run-all`](https://terragrunt.gruntwork.io/docs/reference/cli-options/#run-all)