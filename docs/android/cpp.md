---
title: C++ 笔记
description: cpp note
image: https://picsum.photos/536/354?random&date=2020-12-15
date: 2020-12-15
vssue-title: cpp note
tags:
  - knowledge
categories:
  - android
---

### 概述
c++ 的本质: procedural（面向过程的）、generic（泛型的）、object-based（基于对象的）、object-oriented（面向对象的）

### 基本概念
- **class** 的定义一般分为两部分，分别写在不同的文件中，一部分在头文件（header file）用于声明该 class 所提供的各种操作行为（operation），另一部分是程序代码文件（program text），包含了这些操作行为的实现内容（implementation）。<br/>
命名空间（namespace）是一种将库名称封装起来的方法（可以避免和应用程序发生命名冲突的问题）
- **指针** 为程序引入一层间接性，可以操作指针（代表某特定内存地址），而不再直接操作对象。<br/>
```
int *p; // p 是个 int 类型对象的指针
// 如果用对象名称来执行求值操作
value; // 计算 value 的值会得到 value 所存的值
&value; // 拿到 value 所在的内存地址
int *p = &value; // 拿到 value 的内存地址并赋值给 p
// *p 称为对指针 p 进行提领操作（取得位于该指针所指内存地址上的对象）
// 需要在指针 p 前加上 *
if (*p != 1024) { // 读取 value 的值
	*p = 1024; // 将值写至 value
}

int *p = 0; // 未指向任何对象的指针，其地址值为0（null 指针）
// 为了防止对 null 指针进行提领操作，应该检验该指针所持有的地址是否为 0
if (p && *p != 1024) {
	*p = 1024;
}
```
- **文件读写**

























