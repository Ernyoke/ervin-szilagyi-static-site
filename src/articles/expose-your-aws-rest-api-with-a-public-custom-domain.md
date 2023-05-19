# Expose your AWS REST API with a Public Custom Domain

DNS is hard.

This is absolutely true for huge enterprise networks and distributed systems. With a simple Google search we can find many IT incidents caused by DNS issues.

But this is not the topic of this current article. Most of us are in a position to deal with the DNS for an enterprise systems. What we likely would most likely encounter more frequently would be a simple DNS setup a REST api. Even in this case, DNS can be confusing for uninitiated. The purpose of this article is to clear up certain misconception and to guide the reader through the steps of exposing a REST API publicly on AWS with a custom domain name.

## Get your own domain

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



