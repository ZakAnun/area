---
title: 前端开发环境配置
display: home
description: env set up
image: https://picsum.photos/536/354?random&date=2020-10-13
date: 2020-10-13
vssue-title: web env set up
tags:
  - config
categories:
  - web
---

### 概述
本篇主要记录前端开发环境的配置，环境配置好后，做前端相关的开发都会比较舒服，由于是为了能够基于 Vuepress 搭建博客进行的，因此主要是 nvm、 node、npm、yarn 等工具的安装。
首先简单介绍一下这几个工具
- nvm(Node Version Manager): 用于管理不同版本的 node 和 npm
- node: js 运行时
- npm(Node Package Manager): node 包管理器
- yarn: 功能类似 npm

另外还需要对应的系统的包管理器进行安装 linux -- wget，mac -- brew（windows 直接用安装包安装）

- linux 的 wget 是自带的
- mac 的 brew 如果没有安装过需要安装一下，直接执行 `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"`

---

### 执行
1、通过系统包管理器安装 nvm 并将其加入到环境变量
```
// mac 
brew install nvm
// linux
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.36.0/install.sh | bash

// 检查（成功则能正常显示版本号）
nvm -v 

// linux 需要设置环境变量（NVM_DIR 要加到 path 中，mac 没有设置也能访问）
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```
2、通过 nvm 安装 node（安装 node 的同时会将 npm 也安装上）
```
// mac/linux
nvm install node

// 检查（成功则能正常显示版本号）
node -v
npm -v
```
3、安装 yarn（如果喜欢使用 npm 也可不安装）
```
// mac 可以使用 brew 安装
// brew install yarn
npm install yarn

// 检查（成功则能正常显示版本号）
yarn -v
```

---

### 问题
- 在 linux 上安装没什么问题，可能是在 mac 装过一遍的原因....
- mac 上遇到的问题:
1、在安装 brew 的时候网络不同（有梯子）
直接在终端输入 `export https_proxy=http://127.0.0.1:7890 http_proxy=http://127.0.0.1:7890 all_proxy=socks5://127.0.0.1:7890` 这里的 7890 是梯子的端口号，可以在梯子工具中查看
2、如果在安装过程中遇到了问题可以直接考虑重装...
[重装方法]("https://yamdestiny.xyz/2019/04/24/how-to-reinstall-node-js-on-mac/") 需要删干净之前已安装的文件

---

### 结果
经过上面的操作，理论上已经成功安装了 node，如有其他问题欢迎进行评论指正~