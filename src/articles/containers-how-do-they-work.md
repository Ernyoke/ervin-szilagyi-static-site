# Containers: How do they work?

## Introduction

Nowadays, in software engineering we take containers for granted. We rely on them on day-to-day work, we build highly available and highly scalable production environments with them. But, many of us, software engineers, are struggling to explain what containers fundamentally are. Usually, we point out that they are not virtual machines, which is true, but what are they then? In this article we will try to have a more in-depth understanding about what containers are, how do they work and how can we leverage them for building industry standard systems.

## Playground Set-Up

To understand containers, we would want to play around some container runtimes. Docker is the most popular implementation of a container runtime, we will use that for this article, but there are several other implementations out there, for. example: Podman, LXC/LXD, rkt and many others. 
