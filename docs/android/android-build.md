---
title: Android 编译环境搭建
description: android build
image: https://picsum.photos/536/354?random&date=2020-12-30
date: 2020-12-30
vssue-title: android build
icon: android-build
tags:
  - knowledge
categories:
  - android
---

### 概述
想要更加了解 Android 系统的工作流程，以应对更复杂的业务需求，就需要尽可能了解执行的流程、设计的目的。那就先从编译 Android 系统开始吧。记录是基于 mac OS 进行，如果是 linux 自行查阅资料。因为 mac OS 会在一个保留大小写而不区分大小写的文件系统中运行，Git 并不支持这类文件系统（会导致一些 Git 名称异常），所以需要设置一下 mac OS 的编译环境，否则执行 make 的时候会提示 `You are building on a case-insensitive filesystem.`

### 执行
1、创建区分大小写的磁盘映像，完成编译至少需要 25GB 空间，需要选择 “Case sensitive, Journaled” 存储卷格式，而实践是采用 shell 命令的形式创建，执行命令: `hdiutil create -type SPARSE -fs 'Case-sensitive Journaled HFS+' -size 60g ~/android.dmg`，这个命令将会创建一个 .dmg 或 .dmg.sparseimage 文件（实践是 .dmg.sparseimage），这个文件装载后可以用作具有 Android 开发所需格式的存储卷。如果需要更大的存储卷，可以用命令: `hdiutil resize -size <new-size-you-want>g ~/android.dmg.sparseimage` 来调整稀疏映像的大小
2、对于存储在主目录下的 android.dmg 的磁盘映像，可以在 ~/.bash_profile 中添加辅助函数
```
# mount the android file image 用于装载磁盘映像时执行
function mountAndroid { hdiutil attach ~/android.dmg.sparseimage -mountpoint /Volumes/android; }

# unmount the android file image 用于卸载磁盘映像时执行
function unmountAndroid() { hdiutil detach /Volumes/android; }
```


### 参考资料
[官网文档](https://source.android.com/source/initializing#setting-up-a-mac-os-x-build-environment)



















