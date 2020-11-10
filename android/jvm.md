---
title: JVM 笔记
description: jvm note
image: https://picsum.photos/536/354?random&date=2020-11-02
date: 2020-11-02
vssue-title: jvm note
tags:
  - knowledge
categories:
  - android
---

### 概述
记录了解 jvm 的过程

### mac 配置并编译 open jdk
#### 步骤
1、[拉取 open jdk 项目代码](https://github.com/openjdk/jdk)<br/>
2、安装编译环境
```
brew install freetype
brew install ccache
brew install autoconf

/**
 * 由于编译 open jdk 需要有 root jdk 的要求（文档地址: https://github.com/openjdk/jdk/blob/master/doc/building.md）
 * 因此还需要安装 root jdk，依然通过 brew 完成
 */
brew install cask
brew cask install adoptopenjdk
```
3、验证环境是否安装成功，在 jdk 目录下执行 bash configure，如果出现 configuration summary 的显示则表示编译环境 ok
```
bash configure --with-target-bits=64 --enable-ccache --with-jvm-variants=server,client --disable-warnings-as-errors --with-debug-level=fastdebug 2>&1 | tee configure_mac_x64.log
```
4、执行 make images 进行编译<br/>
5、编译完成后到 jdk 的 build 目录下验证编译后的 jdk 版本，路径 `./build/*/jdk/bin/`，使用该目录下的 java 命令查看 version，一般是 root jdk version +1
#### 问题
都是在执行 bash configure 这个命令提示的问题，只需要逐条解决即可<br/>
1、Runnable configure script is not present -> 执行 brew install autoconf<br/>
2、configure: error: No xcodebuild tool and no system framework headers found -> 执行 sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer<br/>
3、Could not find a valid Boot JDK -> 执行 brew cask install adoptopenjdk<br/>
4、command: cask not found -> 执行 brew install cask<br/>
5、此外如果在执行上述步骤过程中有遇到其他问题，应该可以根据提示解决，因此需要关注每次执行的结果~<br/>
#### 结果
经过上述配置，可以成功编译 jdk

### jvm 垃圾回收与内存分配策略
- 垃圾回收概述
确定区域: Java 内存运行时区域中程序计数器、虚拟机栈、本地方法栈这三个区域的创建与回收是跟随线程进行的（栈中的栈帧随着方法的进入和退出执行入栈和出栈的操作，每一个栈帧所分配的内存都是确定的，因此这几个区域的内存分配与回收都比较确定，不必过多考虑回收的问题）
非确定区域: Java 堆和方法区就有这显著的不确定性（如一个接口有多个实现类，一个方法所执行的不同条件分支所需要的内存都不一样，只有在运行期间，才会知道创建了哪些对象，因此这部分内存的分配和回收是动态的）垃圾收集器所管理的正是这部分内存
- 