# Certificate Parsing with `domain-recon`

## What is Certificate Parsing?

Certificate parsing is a way of conducting web hacking reconnaissance when an attacker is targeting an organization. The goal is to gather information about the organization and widen the attack space by enumerating every possible domain and subdomain owned by an organization. One methodology of enumerating domains and subdomains is to take advantage of the SSL certificates used by the organization. There are several online databases like [crt.sh](https://crt.sh/) and [sslmate](https://sslmate.com/ct_search_api/) which can be used to enumerate certificates issued for domains owned by an organization. Moreover, if we take a look at the `Subject Alternative Name` of a certificate, we might be able to enumerate other hostnames for which the certificate is applied.

## What is `domain-recon`?

[`domain-recon`](https://github.com/domain-recon/domain-recon-rs) is an open-source command line tool written in Rust, which automates certificate parsing. It uses `[crt.sh](https://crt.sh/)` database to fetch information about certificates issued for a domain and all of its subdomains. It extracts all the hostnames from the `Common Name` and `Matching Identities` fields, the result of which will be a list of domains requiring further filtering. We can distinguish the following type of domains in the list:

- registered domains that can be resolved as IPv4 or IPv6 IP addresses;
- unregistered domains;
- wildcard domains, domain names which contain a wildcard character (`*`), for example: `*.example.com`. Wildcards are used to secure multiple subdomain names (hosts) pertaining to the same base domain.

`domain-recon` filters out wildcard domains from the list and tries to do a domain resolution for each non-wildcard domain. It drops all the domain names which are not registered and it displays a list only with the "valid" domain names.

In the case of the wildcard domains, it will try to guess possible subdomains. This is accomplished by taking a [wordlist](https://github.com/domain-recon/domain-recon-rs/blob/main/words.txt) as input and replacing the wildcards with entries from the list. To detect which domain names are registered, it tries to do a domain resolution for each new entry and displays a new list with the successful queries.

## Example of Usage

The source code for `domain-recon` tool can be found on [GitHub](https://github.com/domain-recon/domain-recon-rs). Executables are built and released for all Linux, Mac, and Windows operating systems and can be downloaded from the [releases](https://github.com/domain-recon/domain-recon-rs/releases).

List all the domains and subdomains for `dev.to`:

```bash
domain-recon -d dev.to -f words.txt
```

The output of which will be something like this:

```bash
Fetching certificates...
Extracting domains....
sni.cloudflaressl.com A 104.22.63.243, 172.67.27.61, 104.22.62.243
dev.to A 151.101.194.217, 151.101.2.217, 151.101.66.217, 151.101.130.217
sni174710.cloudflaressl.com A 172.67.27.61, 104.22.63.243, 104.22.62.243
www.jobs.dev.to A 188.114.97.13, 188.114.96.13
jobs.dev.to A 188.114.97.13, 188.114.96.13
t2.shared.global.fastly.net A 151.101.2.217, 151.101.66.217, 151.101.130.217, 151.101.194.217
2020.dev.to A 3.67.255.218, 34.141.28.239
storybook.dev.to A 3.67.234.155, 3.67.153.12
shop.dev.to A 23.227.38.74
status.dev.to A 52.215.192.133
docs.dev.to A 34.141.11.154, 34.159.58.69
customer-service.status-ovhcloud.com A 52.215.192.131
status-beta.sailpoint.com A 52.215.192.132
itstatus.stmonicatrust.co.uk A 52.215.192.131

Expanding wildcards...
admin.forem.com A 35.198.80.163, 34.141.28.239
docs.forem.com A 34.141.28.239, 34.141.48.9
demo.forem.com A 3.19.109.223, 3.135.110.253, 3.13.138.118
www.forem.com A 34.251.201.224, 54.194.170.100, 34.253.101.190
www.dev.to A 188.114.97.13, 188.114.96.13
```

We can omit to expand wildcards by not specifying a wordlist:

```bash
domain-recon -d dev.to
```

Output:

```
Fetching certificates...
Extracting domains....
jobs.dev.to A 188.114.97.13, 188.114.96.13
sni174710.cloudflaressl.com A 104.22.62.243, 172.67.27.61, 104.22.63.243
dev.to A 151.101.194.217, 151.101.2.217, 151.101.66.217, 151.101.130.217
www.jobs.dev.to A 188.114.97.13, 188.114.96.13
shop.dev.to A 23.227.38.74
sni.cloudflaressl.com A 104.22.63.243, 172.67.27.61, 104.22.62.243
storybook.dev.to A 3.67.255.218, 3.67.153.12
docs.dev.to A 34.141.11.154, 34.159.132.250
customer-service.status-ovhcloud.com A 52.215.192.133
status-beta.sailpoint.com A 52.215.192.133
t2.shared.global.fastly.net A 151.101.2.217, 151.101.66.217, 151.101.130.217, 151.101.194.217
2020.dev.to A 3.67.255.218, 34.141.11.154
status.dev.to A 52.215.192.131
itstatus.stmonicatrust.co.uk A 52.215.192.133
```

We can use the `--plain` flag to suppress displaying IP addresses. This can be useful if we want a list with domain names only, which can be provided as input for tools such as [`httpx`](https://www.python-httpx.org/).

Example:

```bash
$ domain-recon -d dev.to -f words.txt --plain | httpx -probe -sc -title -ip

    __    __  __       _  __
   / /_  / /_/ /_____ | |/ /
  / __ \/ __/ __/ __ \|   /
 / / / / /_/ /_/ /_/ /   |
/_/ /_/\__/\__/ .___/_/|_|
             /_/              v1.2.5

        projectdiscovery.io

Use with caution. You are responsible for your actions.
Developers assume no liability and are not responsible for any misuse or damage.
http://sni174710.cloudflaressl.com [SUCCESS] [301] [] [104.22.62.243]
https://www.dev.to [SUCCESS] [301] [] [188.114.97.8]
https://jobs.dev.to [SUCCESS] [301] [] [188.114.97.13]
https://t2.shared.global.fastly.net [SUCCESS] [] [Fastly error: unknown domain t2.shared.global.fastly.net] [151.101.114.217]
https://shop.dev.to [SUCCESS] [301] [] [23.227.38.74]
https://dev.to [SUCCESS] [200] [DEV Community 👩‍💻👨‍💻] [151.101.130.217]
http://www.jobs.dev.to [SUCCESS] [308] [] [188.114.97.8]
https://admin.forem.com [SUCCESS] [200] [Hello from Forem Admin Docs | Forem Admin Docs] [34.141.28.239]
https://docs.dev.to [SUCCESS] [301] [] [3.64.200.242]
https://2020.dev.to [SUCCESS] [200] [thank you] [3.125.16.34]
https://storybook.dev.to [SUCCESS] [200] [Webpack App] [18.159.128.50]
https://shop.forem.com [SUCCESS] [200] [Forem Shop] [23.227.38.74]
http://sni.cloudflaressl.com [SUCCESS] [301] [] [172.67.27.61]
https://www.forem.com [SUCCESS] [200] [[Forem] Community for Everyone] [34.253.101.190]
https://status.dev.to [SUCCESS] [200] [DEV Status] [52.215.192.131]
https://customer-service.status-ovhcloud.com [SUCCESS] [200] [Customer Service Status] [52.215.192.132]
https://docs.forem.com [SUCCESS] [301] [] [34.159.168.235]
https://itstatus.stmonicatrust.co.uk [SUCCESS] [200] [St Monica Trust IT Status] [52.215.192.133]
https://status-beta.sailpoint.com [SUCCESS] [302] [] [52.215.192.131]
https://demo.forem.com [SUCCESS] [200] [Dunder Mifflin Community 📄] [3.19.109.223]
```

## Limitations

`domain-recon` can discover domain names that have public SSL certificates. Currently, it scans only valid certificates, this can be easily changed to include invalid ones as well, but according to my experience, this is not as useful.

Nowadays, most websites have SSL certificates, including development and testing environments as well. It can be helpful for a pen-tester to scan for these environments. Obviously, it can not find environments without registered SSL certificates.

`domain-recon` currently uses Google, Cloudflare, and Quad9 domain resolvers. By default, it is set to use Google only, which we can override with `--dns_resolver` argument. We can also set to use multiple resolvers at the same time (`--dns_resolver="google,cloudflare,quad9"`). According to my experience, having only one resolver might invoke rate limiting if we are scanning a huge number of domains at the same time. Unfortunately, there are slowdowns with multiple resolvers as well. It relies on [`async-std-resolver`](https://docs.rs/async-std-resolver/latest/async_std_resolver/) crate for DNS resolution. A future improvement would be to optimize the usage of `async-std-resolver` to achieve better performance. Since it relies on async calls, we can run on errors related to having too many opened connections. This is somewhat mitigated by limiting the DNS calls to a lower number, but I'm sure there better ways to deal with it.

## Further Reading

`domain-recon` tool was inspired by ["Bug Bounty Bootcamp: The Guide to Finding and Reporting Web Vulnerabilities"](https://www.amazon.com/Bug-Bounty-Bootcamp-Reporting-Vulnerabilities-ebook/dp/B08YK368Y3) book by [Vickie Li](https://vickieli.dev/about). It is a great resource for anyone interested in web hacking and penetration testing.

## Source Code and Contributing

As mentioned above, the source code for `domain-recon` can be found on GitHub: [https://github.com/domain-recon/domain-recon-rs](https://github.com/domain-recon/domain-recon-rs). It is written entirely in Rust. Any contribution is welcomed. ;)