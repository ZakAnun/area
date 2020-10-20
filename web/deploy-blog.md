---
title: 部署博客
display: false
description: deploy blog
image: https://picsum.photos/536/354?random&date=2020-10-20
date: 2020-10-20
vssue-title: deploy blog
tags:
  - config
categories:
  - web
---

### 概述
&emsp;&emsp;经过搭建，博客的文件已经能够顺利在本地跑起来，最后就剩下将他部署到服务器中，开始的时候，我是直接在本地执行 build 命令，然后将生成的文件 push 到 github 上，最后在服务器上面拉 github 的文件到服务器上对应的目录，开始需要手动执行的脚本还挺多，后来 [朋友](https://www.keeplovepet.cn/) 介绍我说可以在服务器上开个定时脚本，然后定期拉 github 的项目，我们只需要关注 push 操作就可以，其实也挺不错（具体可以去看看他的总结），最终我并没有采用这种方案，因为无意中了解到一个 github 的一个功能[Github Action](https://docs.github.com/cn/free-pro-team@latest/actions)，看起来挺优秀，它能够帮助我们完成一些常规的工作流程，而这些工作流程往往是可以被复用的，然后就尝试去了解并且用上这个功能，具体介绍可以在官方文档了解~
&emsp;&emsp;另外再说一下我用到的工具: 阿里云的服务器（域名也是在阿里云上面申请的，备案啥的都在上面完成了，就是 [公安备案]() 需要在另外的网站上完成

### 执行


### 遇到的问题

### 结束