---
title: 部署博客
display: home
description: deploy blog desc
image: https://picsum.photos/536/354?random&date=2020-10-20
date: 2020-10-20
vssue-title: deploy blog
tags:
  - config
categories:
  - web
---

### 概述

经过搭建，博客的文件已经能够顺利在本地跑起来，最后就剩下将他部署到服务器中，开始的时候，我是直接在本地执行 build 命令，然后将生成的文件 push 到 github 上，最后在服务器上面拉 github 的文件到服务器上对应的目录，开始需要手动执行的脚本还挺多，后来 [朋友](https://www.keeplovepet.cn/) 介绍我说可以在服务器上开个定时脚本，然后定期拉 github 的项目，我们只需要关注 push 操作就可以，其实也挺不错（具体可以去看看他的总结），最终我并没有采用这种方案，因为无意中了解到一个 github 的一个功能 [Github Action](https://docs.github.com/cn/free-pro-team@latest/actions)，看起来挺优秀，它能够帮助我们完成一些常规的、可被复用的工作流程，然后就尝试去了解并且用上这个功能，具体介绍可以在官方文档了解~<br/>
再说一下我用到的服务器: 阿里云（域名也是在这上面申请的，备案啥的都在上面完成了，就是 [公安备案](http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=44030502005986) 需要在另外的网站上完成，配置好服务器的出入端口、域名访问和 nginx 之后，直接通过域名能够访问到默认的 CentOS 页面就证明可以了，具体的操作可以自行搜一下，都是简单的配置，如果这部分有疑问的话欢迎评论一起讨论。<br/>
还有一种方式是可以直接发布到 github.io 的域名下，这种方式有兴趣的人可以搜一下对应的实现。

---

### 执行
1、在根目录下新建 .github/workflows/ 目录，该目录下的 .yml 文件就是主要的逻辑，命名随意（比如: [deploy.yml](https://github.com/ZakAnun/area/blob/master/.github/workflows/deploy.yml)）<br/>
2、往里加入相关的逻辑<br/>
3、再推送到远程仓库<br/>
此时可以在远程仓库的 Actions tab 可以看到刚提交的 workflows 在运行，结果也会在里面显示成功或者失败。<br/>
.yml 文件的键值对解析<br/>
&emsp;name: 表示在 Actions tab 中 Workflows 的名称，可以自己命名<br/>
&emsp;on: 表示在哪个分支 push 的时候会执行这个工作流<br/>
&emsp;jobs: 表示工作流的主要逻辑<br/>

---

### 问题
1、github 与服务器进行交互的方式
最终选择了 [hengkx/ssh-deploy](https://github.com/hengkx/ssh-deploy) 所需要的参数是服务器的公网地址、用户名、密码、端口、编译后目录、服务器的目标目录，这些数据都可以通过 github 上的仓库 -> Settings -> Secrets 进行创建（具体的值是自己服务器相应的数据），使用方式: .yml 文件中指定对应的值<br/>
2、编译后的目录是根在 .vuepress/config.js 下的 dist: 'dist dir' 指定的

---

### 结束
经过配置，每次在 master 分支上 push 修改就会触发工作流（打包并将文件传到服务器上），每次文章更新就不用再重复做打包、传到服务器这些操作了<br/>
如果有其他的疑问，欢迎留言~