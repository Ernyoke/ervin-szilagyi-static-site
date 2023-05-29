# Containers: Under the Hood

## Introduction

Nowadays, in software engineering, we take containers for granted. We rely on them for day-to-day work, we build highly available and highly scalable production environments with them. But, many of us, software engineers, are struggling to understand and consequently what containers fundamentally are. Usually, when explaining to others, we point out that they are not virtual machines, which is true, but we struggle to precisely state what they are. In this article, we will try to have a more in-depth understanding of what containers are, how they work, and how can we leverage them for building industry-standard systems.

## Environment Set-Up

To understand containers, we would want to play around with some *container runtimes*. Docker is the most popular implementation of a container runtime, we will use that for this article. There are several other implementations out there, for example, Podman, LXC/LXD, rkt, and many others.

Moving on with our setup, we would want to use a Linux (Ubuntu) machine on which we can install Docker Engine following the steps from the [Docker documentation](https://docs.docker.com/engine/install/ubuntu/). We would want to specifically use Docker Engine and not Docker Desktop. Docker Desktop will utilize a virtual machine for the host, we don't want to have that virtual machine for our current purposes.

## Process Isolation

Containers are not virtual machines (VMs). Despite having their own hostname, filesystem, process space, and networking stack, they are not VMs. They do not have a standalone kernel, and they cannot have separate kernel modules or device drives installed. They can have multiple processes, which are isolated from the host machine's running processes.

On our Ubuntu host, we can run the following command to get information about the kernel:

```bash
root@ip-172-31-24-119:~# uname -s -r
Linux 5.15.0-1019-aws
```

From the output, we can see that the name of the kernel currently in use is `Linux` with the release version of the kernel `5.15.0-1019-aws` (The `aws` prefix comes from the fact that I'm using an EC2 machine on AWS).

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

We can notice that it is the same as for the host machine. We can conclude that the container and the Ubuntu host machine are sharing the same kernel. Containers rely on the ability of the host operating system to isolate one program from another while allowing these programs to share resources between them such as CPU, memory, storage, and networking resources. This is accomplished by a capability of the Linux kernel, named [**namespaces**](https://en.wikipedia.org/wiki/Linux_namespaces).

Linux namespaces are not a new technology or a recently added feature of the kernel, they have been available for many years. The role of a process namespace is to isolate the processes running inside of it, so they should not be able to see things they shouldn't.

To watch process namespaces created by container runtimes in action, we will use `containerd`. If we followed the installation link from above, we should have `containerd` installed with Docker Engine. Docker uses `containerd` under the hood as its container runtime. A *container runtime* (container engine) provides low-level functionalities to execute containerized processes. 

To access `containerd`, we can use `ctr` command. For example, to check if `containerd` was installed and works correctly, we can run `ctr images ls`, which should return a list of images in case of success, or an error. At this point we most likely don't have any images pulled, so should get an empty response. To pull a `busybox` image we can do the following:

```bash
ctr image pull docker.io/library/busybox:latest
```

We can check again the existing images with `ctr images ls` which should list the `busybox` image. We can run this image using:


```bash
ctr run -t --rm docker.io/library/busybox:latest v1
```

This command will start the image in interactive mode, meaning that we will be provided with an input shell waiting for commands. Now if we want to grab the list of currently running tasks from the host machine, we should get the following answer:

```
TASK    PID     STATUS
v1      1517    RUNNING
```

If we take the PID of the running container, we can get hold of the  parent process of it:

```
root@ip-172-31-24-119:~# ps -ef | grep 1517 | grep -v grep
root        1517    1493  0 21:55 pts/0    00:00:00 sh
root@ip-172-31-24-119:~# ps -ef | grep 1493 | grep -v grep
root        1493       1  0 21:55 ?        00:00:00 /usr/bin/containerd-shim-runc-v2 -namespace default -id v1 -address /run/containerd/containerd.sock
root        1517    1493  0 21:55 pts/0    00:00:00 sh
```

As we might have expected, the parent process is `containerd`. We can get the process namespaces created by `containerd` as well:

```bash
root@ip-172-31-24-119:~# lsns | grep 1517
4026532279 mnt         1  1517 root            sh
4026532280 uts         1  1517 root            sh
4026532281 ipc         1  1517 root            sh
4026532282 pid         1  1517 root            sh
4026532283 net         1  1517 root            sh
```

`containerd` is launched five different types of namespaces for isolating processes running in our `busybox` container. These are the following:

- `mnt`: mount points;
- `uts`: Unix time sharing;
- `ipc`: interprocess communication;
- `pid`: process identifiers;
- `net`: network interfaces, routing tables, and firewalls. 

## Network Isolation

`containerd` is using network namespaces to have network isolation and to simplify configuration. In a lot of cases, our containers act as web servers. For being able to run a web server, we need to choose a network interface and port on which the server will listen on. To solve the issue of port collision (two or more processes listening on the same interface on the same port), container runtimes use virtual network interfaces.

If we would want to see the network namespace created by `containerd`, we will run into an issue. Unfortunately, [network namespaces created by `containerd` are invisible](https://www.baeldung.com/linux/docker-network-namespace-invisible). This means, if we execute `ip netns list` to list all the network namespaces present on our host machine, we most likely get no output. We can still get hold of the namespace created by `containerd` if we do the following:

1. Get the PID of the currently running container:

```bash
root@ip-172-31-24-119:~# ctr task ls
TASK    PID      STATUS
v1      13744    RUNNING
```

2. Create an empty file in `/var/run/netns` location with the container identifier (we will use the container PID as the identifier):

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

## Filesystem Isolation

The idea of process isolation involves preventing a process from seeing things it should not. In terms of files and folders, Linux provides filesystem permissions. The Linux kernel associates an owner and group to each file and folder, on top of that it manages read, write and execute permissions. This permissions system works well, although if a process manages to elevate its privileges, it could see files and folders which should have been forbidden.

A more advanced solution for isolation provided by a Linux kernel is to run a process in an isolated filesystem. This can be achieved by an approach known as [change root](https://en.wikipedia.org/wiki/Chroot). The `chroot` command changes the apparent root directory for the current running process and its children.

For example, we can download Alpine Linux inside a folder and launch an isolated shell using `chroot`:

```bash
ssm-user@ip-172-31-24-119:~$ ls
ssm-user@ip-172-31-24-119:~$ mkdir alpine
ssm-user@ip-172-31-24-119:~$ cd alpine
ssm-user@ip-172-31-24-119:~/alpine$ curl -o alpine.tar.gz http://dl-cdn.alpinelinux.org/alpine/v3.16/releases/x86_64/alpine-minirootfs-3.16.0-x86_64.tar.gz
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100 2649k  100 2649k    0     0  65.6M      0 --:--:-- --:--:-- --:--:-- 66.3M
ssm-user@ip-172-31-24-119:~/alpine$ ls
alpine.tar.gz
```

Let's unpack the archive:

```bash
ssm-user@ip-172-31-24-119:~/alpine$ tar xf alpine.tar.gz
ssm-user@ip-172-31-24-119:~/alpine$ ls
alpine.tar.gz  bin  dev  etc  home  lib  media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var
ssm-user@ip-172-31-24-119:~/alpine$ rm alpine.tar.gz
ssm-user@ip-172-31-24-119:~/alpine$ ls
bin  dev  etc  home  lib  media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var
```

We can recognize these folders from any other Linux distribution. The `alpine` folder has the necessary resources to be used as the root folder. We can run an isolated Alpine shell as follows:

```bash
ssm-user@ip-172-31-24-119:~/alpine$ cd ..
ssm-user@ip-172-31-24-119:~$ sudo chroot alpine sh
/ # ls
bin    dev    etc    home   lib    media  mnt    opt    proc   root   run    sbin   srv    sys    tmp    usr    var
/ #
```

Container runtimes, such as `containerd` (or Docker) implement a similar approach to `chroot` for filesystem isolation. On top of that, they provide a more practical way of setup for the isolation by using **container images**. Container images are ready-to-use bundles that contain all the required files and folders for the base filesystem, metadata (environment variables, arguments), and other executables.

## Resource Limiting

Until now we've seen how we can have process, networking, and filesystem isolation. There is one piece missing from the puzzle: hardware resource limiting. Even if our processes our entirely isolated, they still can "see" the host's CPU, memory, networking, and storage. In the following lines, we will discuss how can we guarantee, that a container is only using the resource allocated to it.

In the case of a Linux kernel the **scheduler** keeps a list of all the processes, from which it tracks all the ones that are ready to run and also how much time each process received. The scheduler is designed to be [fair](https://en.wikipedia.org/wiki/Completely_Fair_Scheduler), meaning it tries to give time to each process to run. It also accepts input regarding the priority of each process. 

In terms of prioritization of processes, we can discuss processes about *real-time* and *non-real-time* policies. Real-time processes have to react fast ("in-real-time") to outside events, so these processes get a higher priority compared to non-real-time processes.

We can use `ps` Linux command to see which process is running in real-time or non-real-time:

```bash
root@ip-172-31-19-81:~# ps -e -o pid,class,rtprio,ni,comm
    PID CLS RTPRIO  NI COMMAND
      1 TS       -   0 systemd
      2 TS       -   0 kthreadd
      3 TS       - -20 rcu_gp
      4 TS       - -20 rcu_par_gp
      5 TS       - -20 netns
      ...
     15 FF      99   - migration/0
     16 FF      50   - idle_inject/0
     17 TS       -   0 kworker/0:1-events
      ...
   1374 TS       -   0 bash
   1385 TS       -   0 ps
```

In the output above we can take a look at the `CLS` column, we can have the following values:

- `TS`: time-sharing, non-real-time policy
- `FF`: FIFO (first in - first out), real-time policy
- `RR`: round-robin, also real-time-policy

In the `RTPRIO` and `NI` columns, we can see the priority of some processes. `RTPRIO` (real-time priority) applies only to real-time processes, while `NI` ("nice" level) applies to non-real-time processes and can have a value between -20 (least nice, highest priority) to 20 (nicest, lowest priority).

Real-time processes are usually not computationally intensive, but when they need CPU, they need it immediately. For all real-time processes to get the CPU they require, the Linux kernel reserves slices of CPU time for each process. The ability to provide slices of CPU time to each process represents the basis of CPU resource isolation in the case of containers. This approach is preferred because one process can not influence the scheduler by requesting more processing time for certain computationally intensive tasks.

To manage container use of CPU cores, Linux uses **control groups (`cgroups`)**. Control groups can do, even more, to cite [Wikipedia](https://en.wikipedia.org/wiki/Cgroups):

> `cgroups` is a Linux kernel feature that limits, accounts for, and isolates the resource usage (CPU, memory, disk I/O, network, etc.) of a collection of processes.

We can add processes to `cgroups`. After a process is in a `cgroup`, the kernel automatically applies the controls from that group.

The creation and configuration of `cgroups` is handled through a specific
kind of filesystem, which by default can be found under `/sys/fs/cgroup` path:

```bash
root@ip-172-31-19-81:/sys/fs/cgroup# ls -F -la
total 0
dr-xr-xr-x 11 root root 0 Oct 17 20:16 ./
drwxr-xr-x  8 root root 0 Oct 17 20:16 ../
-r--r--r--  1 root root 0 Oct 17 20:16 cgroup.controllers
-rw-r--r--  1 root root 0 Oct 17 20:17 cgroup.max.depth
-rw-r--r--  1 root root 0 Oct 17 20:17 cgroup.max.descendants
-rw-r--r--  1 root root 0 Oct 17 20:16 cgroup.procs
-r--r--r--  1 root root 0 Oct 17 20:17 cgroup.stat
-rw-r--r--  1 root root 0 Oct 17 20:43 cgroup.subtree_control
-rw-r--r--  1 root root 0 Oct 17 20:17 cgroup.threads
-rw-r--r--  1 root root 0 Oct 17 20:17 cpu.pressure
-r--r--r--  1 root root 0 Oct 17 20:17 cpu.stat
-r--r--r--  1 root root 0 Oct 17 20:17 cpuset.cpus.effective
-r--r--r--  1 root root 0 Oct 17 20:17 cpuset.mems.effective
drwxr-xr-x  2 root root 0 Oct 17 20:17 dev-hugepages.mount/
drwxr-xr-x  2 root root 0 Oct 17 20:17 dev-mqueue.mount/
drwxr-xr-x  2 root root 0 Oct 17 20:16 init.scope/
-rw-r--r--  1 root root 0 Oct 17 20:17 io.cost.model
-rw-r--r--  1 root root 0 Oct 17 20:17 io.cost.qos
-rw-r--r--  1 root root 0 Oct 17 20:17 io.pressure
-rw-r--r--  1 root root 0 Oct 17 20:17 io.prio.class
-r--r--r--  1 root root 0 Oct 17 20:17 io.stat
-r--r--r--  1 root root 0 Oct 17 20:17 memory.numa_stat
-rw-r--r--  1 root root 0 Oct 17 20:17 memory.pressure
-r--r--r--  1 root root 0 Oct 17 20:17 memory.stat
-r--r--r--  1 root root 0 Oct 17 20:17 misc.capacity
drwxr-xr-x  2 root root 0 Oct 17 20:17 sys-fs-fuse-connections.mount/
drwxr-xr-x  2 root root 0 Oct 17 20:17 sys-kernel-config.mount/
drwxr-xr-x  2 root root 0 Oct 17 20:17 sys-kernel-debug.mount/
drwxr-xr-x  2 root root 0 Oct 17 20:17 sys-kernel-tracing.mount/
drwxr-xr-x 35 root root 0 Oct 17 20:43 system.slice/
drwxr-xr-x  3 root root 0 Oct 17 20:20 user.slice/
```

Each of the entries from above defines the properties of a different resource. We can configure these properties by applying limits.

## Building Container Images

Before building a container image ourselves, let's step a little bit back and investigate how are other, popular images built. We will use Docker to pull an `Apache httpd` image, which we will take it apart to see its content.

Let's pull the image from the Docker registry:

```bash
ssm-user@ip-172-31-24-119:~$ docker pull httpd
Using default tag: latest
latest: Pulling from library/httpd
bd159e379b3b: Already exists
36d838c2f6d6: Pull complete
b55eda22bb18: Pull complete
f6e6bfa28393: Pull complete
a1b49b7ecb8a: Pull complete
Digest: sha256:4400fb49c9d7d218d3c8109ef721e0ec1f3897028a3004b098af587d565f4ae5
Status: Downloaded newer image for httpd:latest
docker.io/library/httpd:latest
```

We can launch a container based on this image and connect to a shell using the command below:

```bash
ssm-user@ip-172-31-24-119:~$ docker run -it httpd /bin/bash
```

Having a shell, we can navigate to the root of the container and list all the files and folders:

```bash
root@17556581d317:/usr/local/apache2# cd /
root@17556581d317:/# ls -lart
total 72
drwxr-xr-x   2 root root 4096 Sep  3 12:10 home
drwxr-xr-x   2 root root 4096 Sep  3 12:10 boot
drwxr-xr-x   1 root root 4096 Oct  4 00:00 var
drwxr-xr-x   1 root root 4096 Oct  4 00:00 usr
drwxr-xr-x   2 root root 4096 Oct  4 00:00 srv
drwxr-xr-x   2 root root 4096 Oct  4 00:00 sbin
drwxr-xr-x   3 root root 4096 Oct  4 00:00 run
drwx------   2 root root 4096 Oct  4 00:00 root
drwxr-xr-x   2 root root 4096 Oct  4 00:00 opt
drwxr-xr-x   2 root root 4096 Oct  4 00:00 mnt
drwxr-xr-x   2 root root 4096 Oct  4 00:00 media
drwxr-xr-x   2 root root 4096 Oct  4 00:00 lib64
drwxrwxrwt   1 root root 4096 Oct  5 04:09 tmp
drwxr-xr-x   1 root root 4096 Oct  5 04:10 lib
drwxr-xr-x   1 root root 4096 Oct  5 04:10 bin
drwxr-xr-x   1 root root 4096 Oct 15 20:19 etc
-rwxr-xr-x   1 root root    0 Oct 15 20:19 .dockerenv
drwxr-xr-x   1 root root 4096 Oct 15 20:19 ..
drwxr-xr-x   1 root root 4096 Oct 15 20:19 .
dr-xr-xr-x  13 root root    0 Oct 15 20:19 sys
dr-xr-xr-x 176 root root    0 Oct 15 20:19 proc
drwxr-xr-x   5 root root  360 Oct 15 20:19 dev
```

The `Apache httpd` image we are using is based on a Debian base image. This means it has a filesystem similar to what we would expect from the Debian Linux distribution. It contains all the necessary files and folders which would be expected by the Apache webserver to function correctly.

Also, if we take another look at the output of the `docker pull` command, we can observe that a bunch of layers was downloaded. Some layers are skipped with the message that they already exist on the host machine. Container images are made up of layers, that can be shared between images. The reason why a layer is skipped during a pull is that was already downloaded during a pull for another image or a previous version of the same image. Docker detects that more than one image has the same layer and it does not retrieve it twice. Layers are used to save space and to speed up the builds and pulls/pushes. 

Layers are created when images are built. Usually, we rely on other base images when building our image. As an example, we use the `httpd` base image, on top of which we add our website, essentially creating another layer. Base images also should come from somewhere, usually, they are built from a minimal Linux filesystem. The Alpine Linux resources downloaded and used for `chroot`, could be used as the base for a container image.

There are several ways to build images, the most popular would be the Docker approach with the usage of `Dockerfiles`. A minimal Dockerfile for using `httpd` as the base image would look like this:

```Dockerfile
FROM httpd:2.4
RUN mkdir -p /usr/local/apache2/conf/sites/
COPY my-httpd.conf /usr/local/apache2/conf/httpd.conf
COPY ./public-html/ /usr/local/apache2/htdocs/
```

Many possible commands can be used when building Docker images. For more information, we would want to check out the [Docker documentation](https://docs.docker.com/engine/reference/builder/). Some widely used commands from a Dockerfile would be the following:

`FROM`: specifies the base image for the current build
`ENV`: specifies an environment variable
`RUN`: a command executed inside of the container while being built
`COPY`: used to copy over files from the host machine to the container while it is being built
`ENTRYPOINT`: specifies the initial process for the container
`CMD`: sets the default parameters for the initial process

## Conclusions

In this article, we have seen what containers are. They are not virtual machines, they are essentially a group of isolated processes with their own isolated filesystem and networking. They share the kernel modules with the host machine. Because of this, they can be lightweight, compared to a fully-fledged virtual machine. They can be part of an agile architecture since they can be spawned up and torn down quickly.

## Links and References

1. Install Docker Engine on Ubuntu: [Docker docs](https://docs.docker.com/engine/install/ubuntu/)
2. Linux Namespaces: [Wikipedia](https://en.wikipedia.org/wiki/Linux_namespaces)
3. Docker Container Network Namespace is Invisible: [baeldung.com](https://www.baeldung.com/linux/docker-network-namespace-invisible)
4. `chroot`: [Wikipedia](https://en.wikipedia.org/wiki/Chroot)
5. Completely Fair Scheduler: [Wikipedia](https://en.wikipedia.org/wiki/Completely_Fair_Scheduler)
6. `cgroups`: [Wikipedia](https://en.wikipedia.org/wiki/Cgroups)
7. Dockerfile reference: [Docker docs](https://docs.docker.com/engine/reference/builder/)

## Additional Reading

1. Building containers by hand using namespaces: The net namespace: [https://www.redhat.com/sysadmin/net-namespaces](https://www.redhat.com/sysadmin/net-namespaces)
2. Basics of Container Isolation: [https://blog.devgenius.io/basics-of-container-isolation-5eabdb258409](https://blog.devgenius.io/basics-of-container-isolation-5eabdb258409)

*This article is heavily inspired by these 2 books:*

1. Alan Hohn -  The Book of Kubernetes: [amazon.com](https://www.amazon.com/Book-Kubernetes-Comprehensive-Container-Orchestration-ebook/dp/B09WJYZKHN)
2. Liz Rice - Container Security: Fundamental Technology Concepts that Protect Containerized Applications: [amazon.com](https://www.amazon.com/Container-Security-Fundamental-Containerized-Applications-ebook/dp/B088B9KKGC)
