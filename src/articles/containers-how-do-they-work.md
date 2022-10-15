# Containers: Under the Hood

## Introduction

Nowadays, in software engineering we take containers for granted. We rely on them on day-to-day work, we build highly available and highly scalable production environments with them. But, many of us, software engineers, are struggling to explain what containers fundamentally are. Usually, we point out that they are not virtual machines, which is true, but what are they then? In this article we will try to have a more in-depth understanding about what containers are, how do they work and how can we leverage them for building industry standard systems.

## Playground Set-Up

To understand containers, we would want to play around some container runtimes. Docker is the most popular implementation of a container runtime, we will use that for this article, but there are several other implementations out there, for. example: Podman, LXC/LXD, rkt and many others.

We would want to use a Linux (Ubuntu) machine on which we can install Docker Engine following the steps from the [Docker documentation](https://docs.docker.com/engine/install/ubuntu/). We would want to specifically use Docker Engine and not Docker Desktop. Docker Desktop will use a virtual machine for the host, we don't want to have that machine for current our purposes.

## Process Isolation

Containers are not virtual machines. Despite having a their own hostname, filesystem, process space and networking, they are not VMs. They do not have a separate kernel, they cannot have separate kernel modules or device drives installed. They can have multiple processes, which are isolated from the host machine's running processes.

On our Ubuntu machine, we can run the following command to get information about the kernel:

```bash
root@ip-172-31-24-119:~# uname -s -r
Linux 5.15.0-1019-aws
```

From the output we can see that the name of the kernel is `Linux`. Because I'm using an AWS EC2 machine, the release version of the kernel is `5.15.0-1019-aws`.

Let's output some more information about our Linux distribution:

```bash
root@ip-172-31-24-119:~# cat /etc/os-release
PRETTY_NAME="Ubuntu 22.04.1 LTS"
NAME="Ubuntu"
VERSION_ID="22.04"
VERSION="22.04.1 LTS (Jammy Jellyfish)"
VERSION_CODENAME=jammy
ID=ubuntu
ID_LIKE=debian
HOME_URL="https://www.ubuntu.com/"
SUPPORT_URL="https://help.ubuntu.com/"
BUG_REPORT_URL="https://bugs.launchpad.net/ubuntu/"
PRIVACY_POLICY_URL="https://www.ubuntu.com/legal/terms-and-policies/privacy-policy"
UBUNTU_CODENAME=jammy
```

Now, let's run Rocky Linux from a Docker container using the following command:

```bash
docker run -ti rockylinux:8
```

The `-ti` flag will run the container in an interactive mode, prompting us to a shell inside the container. Let's fetch some OS information:

```bash
[root@3564a12dd942 /]# cat /etc/os-release
NAME="Rocky Linux"
VERSION="8.6 (Green Obsidian)"
ID="rocky"
ID_LIKE="rhel centos fedora"
VERSION_ID="8.6"
PLATFORM_ID="platform:el8"
PRETTY_NAME="Rocky Linux 8.6 (Green Obsidian)"
ANSI_COLOR="0;32"
CPE_NAME="cpe:/o:rocky:rocky:8:GA"
HOME_URL="https://rockylinux.org/"
BUG_REPORT_URL="https://bugs.rockylinux.org/"
ROCKY_SUPPORT_PRODUCT="Rocky Linux"
ROCKY_SUPPORT_PRODUCT_VERSION="8"
REDHAT_SUPPORT_PRODUCT="Rocky Linux"
REDHAT_SUPPORT_PRODUCT_VERSION="8"
```

It seems like we are connected to a different machine. But if we get information about the kernel, we will get something familiar.

```bash
[root@3564a12dd942 /]# uname -s -r
Linux 5.15.0-1019-aws
```

We can notice that it is the same as for the host machine. We can see that the container and the Ubuntu host machine are sharing the kernel. Containers rely on the ability of the host operating system to isolate on program from another while allowing these programs to share resources between them such as CPU, memory, storage and networking resources. The is accomplished by a capability of Linux kernel, named [**namespaces**](https://en.wikipedia.org/wiki/Linux_namespaces).

Linux namespaces are not new technology or recently added feature of the kernel, they have been available for many years. The role of a namespace is to isolate the processes running inside of it, so it should not be able to see things it shouldn't.

To see process namespaces in action with containers, we will use `containerd`. If we followed the installation link from above, we should have `containerd` installed with Docker Engine. This is because Docker uses `containerd` under the hood for the container runtime. A container runtime (container engine) provides low-level functionalities to execute containerized processes. To access `containerd`, we can use `ctr` command. For example, to check if it works correctly, we can run `ctr images ls`, which will get a list of images. At this point we most likely don't have any images, so we can get a `busybox` image using:

```bash
ctr image pull docker.io/library/busybox:latest
```

We can check again the existing images with `ctr images ls` which should list the `busybox` image. We can run this image using:


```bash
ctr run -t --rm docker.io/library/busybox:latest v1
```

This command will run the image in interactive mode, meaning that we will have a terminal to us from the image. Grabbing the list of currently running tasks with `ctr task ls` command, we should get something similar:

```
TASK    PID     STATUS
v1      1517    RUNNING
```

If we take the PID of the running container, we can get the parent process of it:

```
root@ip-172-31-24-119:~# ps -ef | grep 1517 | grep -v grep
root        1517    1493  0 21:55 pts/0    00:00:00 sh
root@ip-172-31-24-119:~# ps -ef | grep 1493 | grep -v grep
root        1493       1  0 21:55 ?        00:00:00 /usr/bin/containerd-shim-runc-v2 -namespace default -id v1 -address /run/containerd/containerd.sock
root        1517    1493  0 21:55 pts/0    00:00:00 sh
```

As we might have expected, the parent process is `containerd`. Moving on, we can get the process namespaces created by `containerd` with `lsns`:

```bash
root@ip-172-31-24-119:~# lsns | grep 1517
4026532279 mnt         1  1517 root            sh
4026532280 uts         1  1517 root            sh
4026532281 ipc         1  1517 root            sh
4026532282 pid         1  1517 root            sh
4026532283 net         1  1517 root            sh
```

`containerd` is running five different types of namespaces for isolating processes running in our `busybox` container. These are the following:

- `mnt`: mount points;
- `uts`: Unix time sharing;
- `ipc`: interprocess communication;
- `pid`: process identifiers;
- `net`: interfaces, routeing tables and firewalls. 

## Network Isolation

`containerd` is using network namespaces to have network isolation and to simplify configuration. In a lot of cases our containers act as web servers. For being able to run a web server, we need to choose an network interface and port on which the server will listen on. In order to solve the issue of port collision (2 ore more processes listening on the same interface on the same port), container runtimes use virtual network interfaces.

If we would want to see the network namespace created by `containerd`, we will run into an issue. Unfortunately, [network namespaces created by `containerd` are invisible](https://www.baeldung.com/linux/docker-network-namespace-invisible). This means, if we execute `ip netns list` to list all the network namespaces present on our host machine, we most likely get no output. We can still get hold of the namespace if we do the following:

1. Get the PID of the current running container:

```bash
root@ip-172-31-24-119:~# ctr task ls
TASK    PID      STATUS
v1      13744    RUNNING
```

2. Create an empty file in `/var/run/netns` location with the container identifier (we will use the container PID for as the identifier):

```
mkdir -p /var/run/netns
touch /var/run/netns/13744
```

3. Bind the `net` process namespace to this file:

```
mount -o bind /proc/13744/ns/net /var/run/netns/13744
```

Now if we run `ip netns list`, we get the following:

```bash
root@ip-172-31-24-119:~# ip netns list
13744
```

We also can look at the interfaces on the network namespace:

```bash
root@ip-172-31-24-119:~# ip netns exec 13744 ip addr list
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host
       valid_lft forever preferred_lft forever
```

Running `ip a` from inside the `busybox` container, we get similar output:

```bash
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host
       valid_lft forever preferred_lft forever    
```

## Links

1. Install Docker Engine on Ubuntu - [https://docs.docker.com/engine/install/ubuntu/](https://docs.docker.com/engine/install/ubuntu/)
2. Linux Namespaces - [https://en.wikipedia.org/wiki/Linux_namespaces](https://en.wikipedia.org/wiki/Linux_namespaces)
3. Docker Container Network Namespace is Invisible: [https://www.baeldung.com/linux/docker-network-namespace-invisible](https://www.baeldung.com/linux/docker-network-namespace-invisible)