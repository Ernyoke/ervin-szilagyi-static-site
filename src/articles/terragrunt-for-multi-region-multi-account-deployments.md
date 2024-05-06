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

Now all of these come with a price: refactoring. Terragrunt relies on Terraform modules and our initial code was not as modular as one might expect. So we had to refactor a lot, which also came with an even bigger challenge: state management and transferring resources between state.

## Ho does Terragrunt Work?

To use Terragrunt, first we have to be comfortable with [Terraform modules](https://developer.hashicorp.com/terraform/language/modules). The concept of modularization is simple:

- Terraform provides building blocks such as resources and data sources;
- Some of these resources are often used together (for example: a database and Route 53 record for its hostname)
- It might make group these resources together in a reusable container. These reusable containers are called modules.

Modules can communicate between themselves with inputs and outputs. Terragrunt requires us that all of our Terraform resources are part of modules.

In the official Terragrunt documentation there is [a good article](https://terragrunt.gruntwork.io/docs/features/keep-your-terraform-code-dry/) about how to setup a Terragrunt project and where to place modules. In fact, there is an [repository](https://github.com/gruntwork-io/terragrunt-infrastructure-live-example) on GitHub hosting a example project on how the creators recommend to set up Terragrunt. I certainly recommend going to through that project, because it is as good as a reference could be. Having that project as a starting point I like to structure mine a little bit different. My recommendation is to have different AWS accounts for each environment. Usually this is relatively easy to accomplish even if we are working in a corporate job (your workplace most likely is using AWS Organizations to manage accounts), and multiple accounts do not inquire additional costs by themselves, we only pay for the resources and services we use. 

In the [terragrunt-infrastructure-live-example](https://github.com/gruntwork-io/terragrunt-infrastructure-live-example) the split for the environments is done by **prod** an **non-prod** accounts. Each of this is split by region, while the **non-prod** account is also used for **qa** and **stage** environments. This is fine, the one downside being that you have to think about a naming convention for your resources, since in **non-prod** you will have same thing for both **qa** and **stage**. While this is not that big of a deal, I personally prefer to have one environment per region. My proposal for a Terragrunt project setup would look like this:

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
│       │       terragrunt.hcl
│       │
│       ├───ecs-services
│       │   └───frontend
│       │           terragrunt.hcl
│       │
│       └───vpc
│               terragrunt.hcl
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
│   │   │       terragrunt.hcl
│   │   │
│   │   ├───ecs-services
│   │   │   └───frontend
│   │   │           terragrunt.hcl
│   │   │
│   │   └───vpc
│   │           terragrunt.hcl
│   │
│   └───us-east-1
│       │   region.hcl
│       │
│       ├───alb
│       │       terragrunt.hcl
│       │
│       ├───ecs-cluster
│       │       terragrunt.hcl
│       │
│       ├───ecs-services
│       │   └───frontend
│       │           terragrunt.hcl
│       │
│       └───vpc
│               terragrunt.hcl
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
│   │   │       terragrunt.hcl
│   │   │
│   │   ├───ecs-services
│   │   │   └───frontend
│   │   │           terragrunt.hcl
│   │   │
│   │   └───vpc
│   │           terragrunt.hcl
│   │
│   └───us-east-1
│       │   region.hcl
│       │
│       ├───alb
│       │       terragrunt.hcl
│       │
│       ├───ecs-cluster
│       │       terragrunt.hcl
│       │
│       ├───ecs-services
│       │   └───frontend
│       │           terragrunt.hcl
│       │
│       └───vpc
│               terragrunt.hcl
│
└───_env
        alb.hcl
        frontend.hcl
        vpc.hcl
```

Here we have 3 environments: **dev**, **qa** and **prod**. Each environment should be living in a single AWS account. The root of the project contains variables (`locals`) shared by each and every environment. If we go inside an environment, we have the account specific properties (`account.hcl`) and the regions in which we would like to deploy. Inside a region we have the region specific configuration (`region.hcl`) and all the modules we would like to have in the specific region.

Let's take a look on a Terragrunt configuration. For example a possible implementation for the `vpc` module could be the following:

```lang-hcl
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

  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway = true
  enable_vpn_gateway = false
}
```

To give a short explanation for what we see here:

- In the `terraform` block we have to specify a path to a Terraform module. For example, in this case we use the VPC module from the [terraform-aws-modules](https://github.com/terraform-aws-modules/terraform-aws-vpc) open source project. This project is part of the official Terraform registry. We can use any other module hosted by ourself on a Git repository or we can even point it to local path.
- The `include` block is optional. It is used for "inheritance". By inheritance, we can think of as if the parent configuration file is copy/pasted in the current configuration file. As an example, we get all the `inputs` from the parent configurations, but we can append/override certain inputs.
- The `locals` essentially act as Terragrunt `locals`. There are just local "variables" used in the current configuration. We can also read locals from other configurations files with Terragrunt functions (`read_terragrunt_config`).
- The `inputs` are values we provide to the Terraform module. Since we use inheritance, the includes provided by the parent configuration are automatically merged with current includes, making our configuration [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself), arguably less readable, more on this later.

Taking the "DRY"-ness a step further, we can notice that modules such as `vpc` are used in each environment/region with little configurational difference. What we can do is to extract this configuration into a top level folder, such as `_env` and use inheritance to override just what we need. So, the extracted configuration will look like this:

```lang-hcl
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

  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway = true
  enable_vpn_gateway = false
}
```

Let's say we want to inherit this configuration in our `qa` environment which is in `eu-central-1`. We still want to have 3 private and public subnets there, but we need them to be in AZs from EU. We can do the following:

```lang-hcl
# ./qa/eu-west-1/vpc/terragrunt.hcl

include "root" {
  path = find_in_parent_folders()
}

include "env" {
  path = "${get_terragrunt_dir()}/../../_env/vpc.hcl"
}

inputs = {
  azs  = ["eu-west-1a", "eu-west-1b", "eu-west-1c"]
}
```

More or less this is what we need to know in order to write Terragrunt code. Now let's discuss deployments.

The deployment of a Terragrunt project can be accomplished with the following command:

```bash
terragrunt run-all apply
```

If we run this command from the root our our project, Terragrunt will attempt to deploy all the resources in all the accounts. This assumes we have the necessary rights to deploy to each account and we also made sure that Terragrunt knows about the IAM role it can assume to do the provisioning (see: [`iam_role`](https://terragrunt.gruntwork.io/docs/reference/config-blocks-and-attributes/#iam_role)).

In case we don't want to deploy everything everywhere at once, we simply navigate into the folder of the environment/region where we want to provision resources, and we execute the command there. It is simple as that.

In case we want to deploy certain modules only, we have to navigate into the folder of that module and we execute the command there. An important thing to note here, if we run `terragrunt run-all apply` for a module, all the dependencies of that module will also be deployed. This might be time consuming in case we do development and we execute it frequently. To overcome this issue, we can run `terragrunt apply` instead (without the `run-all` command) to omit rolling out the dependencies. The caveat for this is that it will work only if the dependencies were previously rolled out. Terragrunt needs to know the outputs of every dependency in order to have the inputs for the current module.

Terragrunt commands are similar to what we've been accustomed in case of Terraform. We can see the plan by executing the `plan` command (with certain limitation, more about this bellow), we can import resources with the `import` command, we can `force-unlock` the state of a module in case it got stuck with an unsuccessful apply, and so on.

## Downsides and Limitations

Like every other tool, Terragrunt has its own limitations, especially if we are coming from Terragrunt set-up. While I consider Terragrunt it to be a valuable and useful tool, I think is very important to know its limitations in case we consider adopting it.

The following is a list of challenges what I've encountered during its adoption and day-to-day usage. I imagine there are plenty of others which I did not face, this is not an exhaustive list.

1. Complexity of usage: if we are new to Terragrunt, we may get easily overwhelmed by all the new concepts we are introduced. As we get more familiar with what it has to offer, we are faced with all this configuration inheritance, which can be challenging to follow. So, yes, I consider the complexity of its usage as being a downside. I think this wont be an issue as we get more and more experienced with it, but this effort is not something we can just simply wipe off.

2. There is no `plan`, at least is certain cases: this is stated even in the documentation for the [`run-all` command](https://terragrunt.gruntwork.io/docs/reference/cli-options/#run-all)

> [WARNING] Using run-all with plan is currently broken for certain use cases. If you have a stack of Terragrunt modules with dependencies between them—either via dependency blocks or `terraform_remote_state` data sources—and you’ve never deployed them, then `run-all plan` will fail as it will not be possible to resolve the dependency blocks or `terraform_remote_state` data sources!

This might seem a non-issue at first, but if we consider also to following note for the `apply` command...

> [NOTE] Using `run-all` with apply or destroy silently adds the `-auto-approve` flag to the command line arguments passed to Terraform due to issues with shared stdin making individual approvals impossible.

...we can probably guess why it might be dangerous to simply do deployments. Understandable, it might not be such drastic of a situation. My recommendation is that if we have doubts, we should restrict roll-outs to individual modules. There we can do `plan` or `apply` without silently being auto-approved. Also, Terragrunt ment to be used with multiple environments. Having a successful rollout on non-prod environment should make us confident for the production as well.

3. There is no easy way to import Terraform resources (at least I'm not aware of any): in case we have a Terraform project and we decide to transform it to Terragrunt, we most likely will have to manually import all the resources into the new state. This might be a non-issue if we could destroy our Terraform stack and re-provision everything with Terragrunt, but this might not be possible in case of a production environment where availability is important.

4. Deployment Speed: Terragrunt is running Terraform under the hood. If it took a long time for provisioning all the infrastructure with Terraform, it can take even more to roll-out everything with Terragrunt. Now this issue is mitigated if we have well thought out modules and we work on the module level, but it sill can be a problem in certain cases (example: in case need the whole plan for an account for a security scan)

## Alternatives

At the beginning of this article, we have seen why Terragrunt made sense, at least in my case. In the previous section, I've presented some limitations of Terragrunt. Having in mind all of these, we could ask what alternatives we might have?

Here are a few examples which can be used instead of Terragrunt.

1. [Terramate](https://github.com/terramate-io/terramate): it seems like a good alternative, and I think it could have been a better choice for certain issues we had. For example, with Terramate the transition from Terraform might have been easier. Terraform project can be imported into Terramate. We don't have to import all the resources by hand, we don't have to think about how we modularize our Terraform code. The reason it was not chosen, is that my team was mainly familiar with Terragrunt. We had no experience with Terramate, we decided to play it safely.
2. [Terraform Stacks](https://www.hashicorp.com/blog/terraform-stacks-explained): at the point of writing this post, it is still not generally available. It was not even considered by us back then, since it was in private preview and nobody had access to it. It might be a good choice in the future, for now it not something we can use.
3. Terraform Workspaces: as I've stated, we were using workspaces, but we found that it is not the best choice for larger infrastructure. If you start a project, I still recommend sticking to workspaces at the beginning and move to something also afterwards, when it is needed.
4. Insert any other tool here: I understand there are many other options out there. In case we are doing a decision for something that will have to be maintained by multiple people for a living, usually we go with the one tool which has to most support on the internet, it is known by most of the people from the team and generally has a good reputation. There are also other criterias (licensing, activity from the maintainers, general documentation and eas of use, etc.), but these are the most important.


## References:

1. [Terraform Modules](https://developer.hashicorp.com/terraform/language/modules)
1. [Terragrunt Dependency Blocs](https://terragrunt.gruntwork.io/docs/reference/config-blocks-and-attributes/#dependency)
1. [The terraform_remote_state Data Source](https://developer.hashicorp.com/terraform/language/state/remote-state-data)
1. [Keep your Terraform code DRY](https://terragrunt.gruntwork.io/docs/features/keep-your-terraform-code-dry/)
1. [`iam_role`](https://terragrunt.gruntwork.io/docs/reference/config-blocks-and-attributes/#iam_role)
1. [`run-all`](https://terragrunt.gruntwork.io/docs/reference/cli-options/#run-all)