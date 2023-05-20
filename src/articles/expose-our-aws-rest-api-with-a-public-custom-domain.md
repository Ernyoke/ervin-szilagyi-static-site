# Expose our AWS REST API with a Public Custom Domain

DNS is hard.

This is absolutely true for huge enterprise networks and distributed systems. With a simple Google search we can find many IT incidents caused by DNS issues.

But this is not the topic of this current article. Most of us are not in a position to deal with the DNS for an enterprise systems. What we most likely encounter once in-a-while is "a simple" DNS setup for a REST api. Even in this case, DNS can be confusing for uninitiated. The purpose of this article is to clear up certain misconception and to guide the reader through the steps of exposing a REST API publicly on AWS with a custom domain name.

## Get out own domain

If we are thinking about making our API public to the world, we would want to purchase a custom domain. AWS provides a domain registrar where we can buy domains, but there are better third party options out in wild. Purchasing a domain can be an adventure itself, each registrar offering different prices depending on the length/wording/choice of top level domain etc. I own the domain of [*ervinszilagyi.dev*](https://ervinszilagyi.dev/) and I also registered *ervinszilagyi.xyz* for this tutorial (and for my other projects as well). I'm using GoDaddy domain registrar for my domains, and I will be referring to them in this article. I have no affiliation with them, I just happened to use them for my domain purchases. In order to follow the steps of this tutorial, your domain registrar should allow changing the nameservers for the domain, or if you want to delegate only a subdomain, then it should allow to register NS records. If what I was saying is not clear at this point, don't worry to much about it, I will explain bellow. Although, you may want to hold back purchasing a domain for now and you can make the necessary research afterwards.

## Hosted Zones and Records

In AWS, everything related to DNS is handled by Route 53 (the name it's a pun, DNS resolution is using port 53).

Route 53 works with [Hosted Zones](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/hosted-zones-working-with.html), which are "databases" or containers for storing and managing our records. We can have 2 types of Hosted Zones:

- *Private Hosted Zones*: they are used for domains inside Amazon VPC (Virtual Private Cloud). They are not resolvable from the public internet. We won't use them in this tutorial, but it is important to be aware of them.
- *Public Hosted Zones*: they are used for storing records for publicly routable domains. We can access them from the public internet.

Hosted Zones are used to manage [records](https://en.wikipedia.org/wiki/Domain_Name_System#Resource_records). Records are used to store information for our domain, for example: if our domain is mapped to IP address where our backend is running, we can specify a record with this IP address. There are many different [type of records](https://en.wikipedia.org/wiki/List_of_DNS_record_types), for our purposes it is enough if we know about a few of them:

- *A record* (Address record): used to story an IPv4 address
- *CNAME record*: it points to another domain, in case we don't have or we simply can't use an IP address for our backend
- *TXT record* (Text record): used to story additional text information. This text can be information for other humans or for other systems (metadata information)
- *SOA record*: Specifies authoritative information about a DNS zone. Each Hosted Zone has one by default. It cannot be removed or modified.
- *NS record* (Name server record): identifies the name servers for the hosted zone. Each Hosted Zone automatically gets assigned an NS record with 4 nameservers.

Hosted Zones can have [alias records](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resource-record-sets-choosing-alias-non-alias.html). Alias records are Route 53 specific records. The reason for their existence is to overcome a limitation if how DNS works. For a DNS Zone, if we want to register a record pointing to the node, this record has to be either A or AAAA record, which should point to an IP address. The problem with this is that in AWS we don't receive static IP addresses for a lot of services. In order ot overcome this limitation, AWS introduced Alias records. We will use an Alias record for our REST api bellow.

## Configure a custom domain resolution with a Hosted Zone

Let's say we decided on our domain (which in my case is *ervinszilagyi.xyz*) and now we would want to initiate the setup. 

First, we need to create a *public* Hosted Zone for the domain. We should make sure, the name of the Hosted Zone is the same as we decided for our domain.

In AWS Console we should go to Route 53 -> Hosted Zones -> press the Create Hosted Zone button. We should be directed to the following form, where we have to fill in our domain name:

![Create Hosted Zone form](img-expose-your-aws-rest-api-with-a-public-custom-domain/create-hosted-zone.png)

We should make sure we select that we want to create a *public* Hosted Zone and we should press "Create Hosted Zone". After a few moments our hosted zone should be created:

![Hosted Zone created with records](img-expose-your-aws-rest-api-with-a-public-custom-domain/records.png)

We should notice that we have a `SOA` record and an `NS` record with 4 nameservers. What we have to do next, is go to our domain registrar (in my case is GoDaddy) and change the nameservers of our domain:

![GoDaddy Nameservers](img-expose-your-aws-rest-api-with-a-public-custom-domain/change-nameservers.png)

We should copy the nameservers from our Hosted Zone and add them to our GoDaddy settings:

![Set Nameservers](img-expose-your-aws-rest-api-with-a-public-custom-domain/set-nameservers.png)

GoDaddy will warn us that what we are doing is kind of dangerous. We should not worry about this alerts, our nameservers are managed by AWS, so we should be fine.

This change for the nameservers can take time to propagate, so we have to wait a little bit until our domain is usable. In order to check this, we can use the unix `dig` command:

```bash
$ dig +short NS ervinszilagyi.xyz
ns-1976.awsdns-55.co.uk.
ns-832.awsdns-40.net.
ns-47.awsdns-05.com.
ns-1142.awsdns-14.org.
```

In case we get back the 4 nameservers, we can go to the next step where we request a TLS certificate to our domain (jump over the next section, if you don't care about subdomain delegation).

## Delegate a custom subdomain resolution to a Hosted Zone

I own [*ervinszilagyi.dev*](https://ervinszilagyi.dev/). This domain points to my personal website and blog. Obviously, I don't want to change this behavior, I would like other people to read my blog posts. I would still like to use this domain for tutorials.

One way to make us of this domain is to create a subdomain under it and delegate the nameservers resolution for this subdomain only to an AWS Hosted Zone. Let's say I would like to expose my rest API using `rest.ervinszilagyi.dev`.

As before, in the AWS console we should go to Route53 service and create a *public* Hosted Zone for `rest.ervinszilagyi.dev`:

...

## Request a TLS certificate for our domain

TLS certificates are used for secure connectivity between our machine and a remote server in order to make use of the HTTPS protocol. Our plan for this tutorial is to expose a REST API, for which we would use API Gateway. API Gateway will also require a valid certificate for the basepath mapping (will see in detail bellow).

It is very easy to request a certificate with the usage of AWS Certificate Manager. What we have to do is to go into the AWS certificate manager portal from our AWS console and press the request button. We will be redirected to this page:

![Request TLS Certificate](img-expose-your-aws-rest-api-with-a-public-custom-domain/request-cert-1.png)

We need a public certificate, so we have to chose this option. Moving on, we will reach to this page:

![Request TLS Certificate with Details](img-expose-your-aws-rest-api-with-a-public-custom-domain/request-cert-2)

We have to introduce our domain and we should select `DNS validation` option. We have to be able to prove somehow that the domain name for which the certificate is issued is our. With `DNS validation`, AWS will create a record in our Hosted Zone with this proof. For this to happen we may also have to press the `Create Record` button after the certificate was issued.

![Create Record for Certificate Validation](img-expose-your-aws-rest-api-with-a-public-custom-domain/cert-status-create-record.png)

If we go to our Hosted Zone, we should see the newly created record:

![Certificate Validation Record](img-expose-your-aws-rest-api-with-a-public-custom-domain/cert-status-record-created.png)

We should make sure we have this record and our certificate validation status is green.


