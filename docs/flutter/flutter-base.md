---
title: Flutter 概述
description: flutter base
image: https://picsum.photos/536/354?random&date=2021-09-22
date: 2021-09-22
vssue-title: flutter base
tags:
  - knowledge
categories:
  - flutter
---

## 跨平台的发展历程
### 跨平台的目标
为了尽量减少业务实现的差异性，降低维护成本，减少因系统差异而需要适配的工作量
### Web 容器
通过 WebView 加载网页，优点是可以达到跨平台的目标，缺点是因需要经历 WebView 的加载、解析和渲染这些过程，整体上要比原生更耗费性能
### 模拟 Web 渲染
这种方式主要是基于 Web 容器的优化，通过 JS 虚拟机提供所需 UI 控件，通过 JS 开发的 UI 最终会交由原生进行加载、绘制（RN），缺点是需要处理平台相关的逻辑如系统版本变化、API 升级的变化，还要因不同平台原生控件的渲染能力差异做出优化适配
### 自绘引擎
重写一套跨平台的 UI 框架，渲染引擎依靠跨平台 Skia 图形库实现，Skia 是个跨平台的图像处理库，可以调度系统绘制，一定程度上抹平了模拟 Web 渲染能力差异的缺点

## Flutter 的关键技术
目的: 不需要业务迁就技术...
重写底层渲染逻辑和上层开发语言的完整解决方案，好处是可以保证视图渲染在 Android 和 iOS 上高度一致，在执行效率上也可以媲美原生 App 的体验
- RN 通过 JS VM 扩展调用系统组件，由 Android 和 iOS 系统进行组件渲染
- Flutter 自己完成组件渲染闭环

Flutter 通过 CPU 计算好需要显示的内容，然后由 GPU 完成渲染后放入帧缓冲区，然后由垂直同步信号（VSync）以每秒 60 次的速度，从缓冲区读取数据交由显示器完成图像显示
CPU 通过 Dart 描述的视图结构，通过 Skia 加工成 GPU 数据后通过 OpenGL 最终提供 GPU 渲染
Flutter 架构于 Skia（跨平台）之上，所以在渲染上可以达到跨平台的预期
Dart 同时只是 JIT（即时编译）和 AOT（事前编译）

Flutter 中，Widget 是整个视图描述的基础，所以重写 build 方法来告诉 Flutter 如何构建 UI 界面
一个 Widget （Stateful Widget 和 Stateless Widget）
StatefulWidget 依赖的数据在 Widget 生命周期中可能会频繁变化，由 State 创建 Widget 以数据驱动视图更新，而不是直接操作 UI 更新视觉属性
setState() 是 Flutter 以数据驱动视图更新的关键函数，状态的更改需要配合使用 setState，这个方法会在底层标记 Widget 的状态，然后出发重建

Flutter 渲染优化，因为 Flutter 是基于数据驱动，当数据改变时，需要重新创建 Widget 更新界面，即 Widget 的创建和销毁会非常频繁，Flutter 优化是通过中间层收敛上层 UI 配置对底层真是渲染的改动，从而最大程度降低对真实渲染视图的修改，提高渲染效率，而不是上层 UI 配置变了就需要销毁整个渲染视图树重建





























