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

### Java 内存管理
- **基本数据区域**<br/>
**方法区（Method Area）**-> 所有线程共享的内存区域，用于存储已经被虚拟机加载的类型信息、常量、静态变量、即时编译器编译后的代码缓存等数据（别名: 非堆用于区分堆），这个区域回收目标主要是常量池的回收和对类型的卸载，如果方法区无法满足新的内存分配时，将会抛出内存溢出（OOM）。方法区还包含了**运行时常量池（Runtime Constant Pool）**-> 用于存放类在编译期生成的各种字面量与符号引用，在类加载后存放到这个区域（在运行期间也可以将新的常量加入到常量池中 String#intern()），当常量池无法再申请到内存是会抛出内存溢出（OOM）<br/>
**堆（Heap）**-> 所有线程共享的内存区域，在虚拟机启动时创建，基本上用于存放对象实例，也是垃圾收集器所要管理的区域，分代管理只是为了更好地分配/回收内存，目前的虚拟机都是设计为可扩展的堆内存大小，如果堆中没有内存进行分配并且无法再扩展时，就会抛出内存溢出（OOM）<br/>
**虚拟机栈（VM Stack）**-> 线程私有，执行的是字节码，描述的是 Java 方法执行的线程内存模型，每个方法被执行时，会同步创建一个栈帧用于存储局部变量表、操作数栈、动态连接、方法出口等信息，一个方法被调用完毕就对应一个栈帧在虚拟机中从入栈到出栈的过程。（是常说的栈内存或是指其中的局部变量表，会出现内存异常问题）<br/>
**本地方法栈（Native Stack）**-> 与虚拟机栈的作用类似，但执行的是 Native 方法，可供虚拟机自由显示，同那样会出现内存异常问题。<br/>
**程序计数器（Program Counter Register）**-> 可以看作是当前线程所执行的字节码的行号指示器，处理分支、循环、跳转、异常、线程恢复等基础功能。为了每个线程在切换后能正常恢复，每个线程都需要有一个独立的程序计数器，各个线程之间计数器互不影响。<br/>
- **其他数据区域**<br/>
**直接内存（Direct Memory）**-> 并不是虚拟机运行时数据区的一部分也不是 Java 虚拟机中定义的内存区域，但这部分内存也被频繁地使用且也可能会导致OOM。JDK 1.4 中新引入了 NIO（New Input/Output）类，是一种基于通道（Channel）与缓冲区（Buffer）的 I/O 方式，可以使用 Native 函数库直接分配堆外内存，然后通过一个存储在 Java 堆里的 DirectByteBuffer 对象作为这块内存的引用进行操作，在部分场景中提高了性能，这部分内存虽然不会收到堆内存大小限制，但会受物理机器总内存的限制。（在内存配置的过程中需要保留这部分内存，避免各个内存区域的总和大于物理内存，导致在动态扩展时出现 OOM）<br/>
- **常见的内存区域异常**<br/>
**StackOverflowError**: 如果线程请求的栈深度大于虚拟机所允许的深度，将会抛出此异常<br/>
**OutOfMemoryError**: 如果 Java 虚拟机栈容量可以动态扩展，当栈扩展时无法申请到足够的内存时，将会抛出此异常

### jvm 垃圾回收与内存分配策略
- 垃圾回收概述
确定区域: Java 内存运行时区域中程序计数器、虚拟机栈、本地方法栈这三个区域的创建与回收是跟随线程进行的（栈中的栈帧随着方法的进入和退出执行入栈和出栈的操作，每一个栈帧所分配的内存都是确定的，因此这几个区域的内存分配与回收都比较确定，不必过多考虑回收的问题）
非确定区域: Java 堆和方法区就有这显著的不确定性（如一个接口有多个实现类，一个方法所执行的不同条件分支所需要的内存都不一样，只有在运行期间，才会知道创建了哪些对象，因此这部分内存的分配和回收是动态的）垃圾收集器所管理的正是这部分内存









