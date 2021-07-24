---
title: 收集一些写得好的文章
description: Android Motion
image: https://picsum.photos/536/354?random&date=2021-07-22
date: 2021-07-22
vssue-title: Anndroid Motion
tags:
  - knowledge
categories:
  - android
---

# Android Motion

## 概述
这是一片翻译的文章，想了解一下酷炫的转场动画的实现，[原文档点这里](https://github.com/material-components/material-components-android/blob/master/docs/theming/Motion.md)<br/>
质感运动（这个翻译看着怪怪的...）是一组过渡模式，可以帮助用户理解和导航应用程序，[规范文档](https://material.io/design/motion/the-motion-system.html)

使用 Android Motion 需要添加 Material Components 依赖，[接入文档](https://github.com/material-components/material-components-android/blob/master/docs/getting-started.md)
（注: Motion theming 目前在 Android version 1.4.0-alpha01 以上使用）

适用于 Android 的 Material Component 支持 Material 规范中定义的四种运动模式<br/>
1、Container transform（容器转换）<br/>
2、Shared axis（共享轴）<br/>
3、Fade through（淡入淡出）<br/>
4、Fade（褪色）<br/>

## Container transform（容器转换）

### 介绍
容器转换模式专为包含容器的 UI 元素之间的转换而设计，这种模式在两个 UI 元素之间创建一个可见的连接。<br/>
这种模式是共享元素过渡。与传统的 Android 共享元素不同，这种模式不是围绕在两个场景之间移动的单个共享内容（如图像）而设计的。相反，这里的共享元素是指起始 View 或 ViewGroup 的边界容器（例如列表中的一个 item 布局）将其大小和形状转换为结束 View 或 ViewGroup 的大小和形状（例如全屏 Fragment）。这些开始和结束容器视图是容器转换的“共享元素”。当这些容器被转换时，他们的内容被交换以创建转换。<br/>
Container transform 例子<br/>
1、点击列表 item 进入到 item 详情页<br/>
2、点击按钮进入新的页面<br/>

### 使用
容器转换可以配置各个 Android 结构之间转换，包括 Fragment、Activity 和 View<br/>
注意点: <br/>
1、开始和结束布局之间的映射必须是 1:1（两个容器的共享元素是一一对应关系）<br/>
2、Fragment 可以定义进入和返回共享元素转换，当只设置了一个 enter 共享元素转换时，会在 Fragment 返回时重新使用。MaterialContainerTransform 内部根据它是进入还是返回来配置过渡的属性，进入和返回样式的自定义参考[文档](https://github.com/material-components/material-components-android/blob/master/docs/theming/Motion.md#customization)

### 示例
[示例代码](https://github.com/ZakAnun/android-practice/blob/master/practice/practiceMotion/src/main/java/com/zakli/practicemotion/FirstActivity.kt)，在代码中的 Container transform 注释中，另外还有可以手动设置转换的开始和结束视图，代码如下
```
val transform = MaterialContainerTransform().apply {
  // Manually tell the container transform which Views to transform between.
  startView = fab
  endView = bottomToolbar

  // Ensure the container transform only runs on a single target
  addTarget(endView)

  // Optionally add a curved path to the transform
  pathMotion = MaterialArcMotion()

  // Since View to View transforms often are not transforming into full screens,
  // remove the transition's scrim.
  scrimColor = Color.TRANSPARENT
}

// Begin the transition by changing properties on the start and end views or
// removing/adding them from the hierarchy.
TransitionManager.beginDelayedTransition(container, transform)
fab.visibility = View.GONE
bottomToolbar.visibility = View.VISIBLE

// Tips: 返回也设置一样的 transform，可见性的设置要反过来
// fab.visibility = View.GONE
// bottomToolbar.visibility = View.VISIBLE
```

## Shared axis（共享轴）

### 介绍
共享轴模式用于具有空间或导航关系的 UI 元素之间的转换。这个模式在 x、y 或 z 轴上使用共享变换来加强元素之间的关系

### 使用
MaterialSharedAxis 是一个可见性过渡。当目标视图的可见性改变或视图被添加或删除时，会触发可见性转变。这意味着 MaterialSharedAxis 需要一个 View 改变可见性或添加或删除以触发动画。<br/>
MaterialSharedAxis 使用向前或向后移动的概念，共享轴方向<br/>

| Axis | Forward（向前） | Backward（向后） |
| X | Left on x-axis | Right on x-axis |
| Y | Up on y-axis | Down on y-axis |
| Z | Forward on z-axis | Backward on z-axis |

注意: 由于共享轴的方向与其目标是否出现或显示无关（出现呢的目标有时会在进入时向前移动，退出时向前移动），因此仅设置目标的进入过渡时，MaterialSharedAxis 无法自动反转。因此，需要使用正确的方向以及设置目标的转换（包括进入、退出、返回、重新进入）<br/>
共享轴转换可以配置为在许多 Android 结构之间转换（包括 Fragment、Activity、View）

### 示例
[示例代码](https://github.com/ZakAnun/android-practice/blob/master/practice/practiceMotion/src/main/java/com/zakli/practicemotion/FirstActivity.kt)，在代码中的 Shared axis 注释中

## Fade through（淡入淡出）

### 介绍
淡入淡出模式用于 UI 元素之间的过渡，他们之间没有很强的关系

### 使用
MaterialFadeThrough 是一个可见性过渡。当目标视图的可见性改变或视图被添加或删除时，会触发可见性转换。这意味着 MaterialFadeThrough 需要一个 View 改变可见性或被添加或被删除以触发其动画。<br/>
淡入淡出可以配置为在许多 Android 结构之间转换（包括 Fragment、Activity、View）

### 示例
[示例代码](https://github.com/ZakAnun/android-practice/blob/master/practice/practiceMotion/src/main/java/com/zakli/practicemotion/FirstActivity.kt)，在代码中的 Fade through 注释中

## Fade（褪色）

### 介绍
用于在屏幕边界内进入或退出的 UI 元素（例如在屏幕中心淡出的对话框）

### 使用
MaterialFade 是一个可见性过渡。当目标视图的可见性改变或视图被添加或被删除时，会触发可见性转换。这意味着 MaterialFade 需要一个 View 改变可见性或被添加或被删除以触发其动画。

### 示例
[示例代码](https://github.com/ZakAnun/android-practice/blob/master/practice/practiceMotion/src/main/java/com/zakli/practicemotion/FirstActivity.kt)，在代码中的 Fade 注释中

















