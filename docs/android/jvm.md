---
title: JVM 笔记（《深入理解 Java 虚拟机》）
description: jvm note
image: https://picsum.photos/536/354?random&date=2020-11-02
date: 2020-11-02
vssue-title: jvm note
icon: jvm
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
**方法区（Method Area）**: 所有线程共享的内存区域，用于存储已经被虚拟机加载的类型信息、常量、静态变量、即时编译器编译后的代码缓存等数据（别名: 非堆用于区分堆），这个区域回收目标主要是常量池的回收和对类型的卸载，如果方法区无法满足新的内存分配时，将会抛出内存溢出（OOM）。方法区还包含了**运行时常量池（Runtime Constant Pool）**-> 用于存放类在编译期生成的各种字面量与符号引用，在类加载后存放到这个区域（在运行期间也可以将新的常量加入到常量池中 String#intern()），当常量池无法再申请到内存是会抛出内存溢出（OOM）<br/>
**堆（Heap）**: 所有线程共享的内存区域，在虚拟机启动时创建，基本上用于存放对象实例，也是垃圾收集器所要管理的区域，分代管理只是为了更好地分配/回收内存，目前的虚拟机都是设计为可扩展的堆内存大小，如果堆中没有内存进行分配并且无法再扩展时，就会抛出内存溢出（OOM）<br/>
**虚拟机栈（VM Stack）**: 线程私有，执行的是字节码，描述的是 Java 方法执行的线程内存模型，每个方法被执行时，会同步创建一个栈帧用于存储局部变量表、操作数栈、动态连接、方法出口等信息，一个方法被调用完毕就对应一个栈帧在虚拟机中从入栈到出栈的过程。（是常说的栈内存或是指其中的局部变量表，会出现内存异常问题）<br/>
**本地方法栈（Native Stack）**: 与虚拟机栈的作用类似，但执行的是 Native 方法，可供虚拟机自由显示，同那样会出现内存异常问题。<br/>
**程序计数器（Program Counter Register）**: 可以看作是当前线程所执行的字节码的行号指示器，处理分支、循环、跳转、异常、线程恢复等基础功能。为了每个线程在切换后能正常恢复，每个线程都需要有一个独立的程序计数器，各个线程之间计数器互不影响。<br/>
- **其他数据区域**<br/>
**直接内存（Direct Memory）**: 并不是虚拟机运行时数据区的一部分也不是 Java 虚拟机中定义的内存区域，但这部分内存也被频繁地使用且也可能会导致OOM。JDK 1.4 中新引入了 NIO（New Input/Output）类，是一种基于通道（Channel）与缓冲区（Buffer）的 I/O 方式，可以使用 Native 函数库直接分配堆外内存，然后通过一个存储在 Java 堆里的 DirectByteBuffer 对象作为这块内存的引用进行操作，在部分场景中提高了性能，这部分内存虽然不会收到堆内存大小限制，但会受物理机器总内存的限制。（在内存配置的过程中需要保留这部分内存，避免各个内存区域的总和大于物理内存，导致在动态扩展时出现 OOM）<br/>
- **常见的内存区域异常**<br/>
**StackOverflowError**: 如果线程请求的栈深度大于虚拟机所允许的深度，将会抛出此异常<br/>
**OutOfMemoryError**: 如果 Java 虚拟机栈容量可以动态扩展，当栈扩展时无法申请到足够的内存时，将会抛出此异常

### jvm 垃圾回收与内存分配策略
- **垃圾回收概述**<br/>
**确定区域**: Java 内存运行时区域中程序计数器、虚拟机栈、本地方法栈这三个区域的创建与回收是跟随线程进行的（栈中的栈帧随着方法的进入和退出执行入栈和出栈的操作，每一个栈帧所分配的内存都是确定的，因此这几个区域的内存分配与回收都比较确定，不必过多考虑回收的问题）<br/>
**非确定区域**: Java 堆和方法区就有这显著的不确定性（如一个接口有多个实现类，一个方法所执行的不同条件分支所需要的内存都不一样，只有在运行期间，才会知道创建了哪些对象，因此这部分内存的分配和回收是动态的）垃圾收集器所管理的正是这部分内存
- **判断对象是否存活**<br/>
**引用计数法**: 思路是在对象中添加引用计数器，每当有引用它时计数器值加一，引用失效则减一，计数器为零的对象表示不再被使用（但主流的 Java 虚拟机没有选用这种算法管理内存，因为需要配合大量额外处理才能保证正确，如对象间的循环引用，引用计数则无法回收）<br/>
**可达性分析算法**: 主流的内存管理方式，思路通过一系列被称为“GC Roots”的根对象作为起始节点集，从这些节点开始，根据引用关系向下搜索，搜索过程所走过的路径成为“引用链”，如果某个对象到 GC Roots 间没有任何引用链相连（从 GC Roots 到这个对象不可达），就证明对象不能再被使用<br/>
- **GC Roots 对象**<br/>
1、在虚拟机栈（栈帧中的本地变量表）中引用的对象（如: 各个线程被调用的方法堆栈中使用到的参数、局部变量、临时变量..）<br/>
2、在方法区中类静态属性引用的对象（如: Java 类的引用类型静态变量）<br/>
3、在方法区中常量引用的对象（如: 字符串常量池（String Table）里的引用<br/>
4、在本地方法栈中 JNI（Native 方法）引用的对象<br/>
5、Java 虚拟机内部的引用（如: 基本数据类型对应的 Class 对象，一些常驻的异常对象（NullPointException、OutOfMemoryError ）等，还有系统类加载器<br/>
6、所有被同步锁（synchronized 关键字）持有的对象<br/>
7、反映 Java 虚拟机内部情况的 JMXBean、JVMTI 中注册的回调、本地代码缓存等<br/>
此外，还可以有其他对象临时性加入（在不同的内存区域）共同构成完整 GC Roots 集合<br/>
- **对象死亡过程**<br/>
一个对象死亡，至少要经历两次标记过程: 如果对象在进行可达性分析后发现没有与 GC Roots 相连接的引用链，那它将会被第一次标记，随后进行一次筛选，条件是此对象是否有必要执行 finalize()，若对象没有覆盖 finalize() 或 finalize() 已被虚拟机调用过，那么虚拟机将这两种情况都视为“没有必要执行”，如果判定为有必要执行 finalize() 那么该对象将会被放置在一个名为 F-Queue 的队列中，并在稍后由一条由虚拟机自动建立的、低调度优先级的 Finalizer 线程去执行它们的 finalize()，虚拟机会触发 finalize() 开始运行，但不承诺要等待它运行结束，是因为如果某个对象的 finalize() 执行缓慢或者发生死循环，将会可能导致 F-Queue 队列中的其他对象永久处于等待，甚至导致整个内存回收子系统崩溃。<br/>
- **回收方法区**<br/>
方法区的垃圾手机主要回收废弃的常量和不再使用的类型<br/>
对于常量是否可以被回收只需要判断是否有引用可达该常量<br/>
而类型是否可以被回收则需要同步满足一下三个条件:<br/>
1、该类所有的实例都已经被回收，即 Java 堆中不存在该类及其任何派生子类的实例<br/>
2、加载该类的类加载器已经被回收，（比较难达成）<br/>
3、该类对应的 java.lang.Class 对象没有在任何地方被引用，无法在任何地方通过发射访问该类的方法<br/>
- **分代收集（主流的垃圾收集方法）**<br/>
设计原则: 收集器应该将 Java 堆划分出不同的区域，然后将回收对象依据其年龄（即对象熬过垃圾收集过程的次数）分配到不同的区域之中存储（能同时兼顾垃圾收集的时间开销和内存的空间有效利用）<br/>
在 Java 堆划分出不同的区域后，垃圾收集器才可以每次只回收其中某一个或某些部分的区域，因而发展出“标记-复制算法”“标记-清除算法”“标记-整理算法”<br/>
一般的设计中会将 Java 堆划分为新生代（每次垃圾收集会出现大批对象死去）和老年代（每次回收后存活少量对象在这存放）<br/>
**标记-清除算法**: 是最基础的收集算法，分为标记和清除两个阶段，先标记出所有需要回收的对象，标记完成后，统一回收所有被标记的对象。缺点: 1、执行效率不稳定（若 Java 堆中包含大量对象，且其中大部分是要被回收的，此时就需要进行大量标记和清除的动作，导致执行这两过程的效率降低）2、内存空间的碎片化问题（清除后会产生大量不连续的内存碎片，碎片太多会导致程序在之后的运行过程中要分配较大对象时，无法找到足够的连续内存而需要继续出发 GC）<br/>
**标记-复制算法（复制算法）**: 为了解决标记-清除算法面对大量可回收对象时执行效率低的问题。它将可用内存按容量划分为大小相等的两块，每次只用其中一块，当这块内存用完了，就将还存活着的对象复制到另外一块去，然后把已使用过的内存空间一次清理掉。缺点: 当内存中多数对象都是存活时，这种方法也会产生较大的开销，另外还将可用内存缩小了一半。目前的优化是调整两块区域的大小（再额外区分出一个担保区间减少 50% 内存空间的浪费）<br/>
**标记-整理算法**: 为了解决标记-复制算法在对象存活率较高时复制操作增多导致效率下降的问题，在老年代中会使用标记-整理算法，标记过程跟标记-清除算法一样，但后续不是直接对可回收对象进行整理，而是让所有存活的对象都向内存空间一端移动，然后直接清理掉边界以外的内存。但在老年代中由于每次回收都有大量对象存活，移动存活对象并更新所有引用这些对象的地方也是一种很重的操作（这操作还必须全程暂停用户应用程序才能进行，这样的停顿被描述为“Stop The World”）<br/>
- **内存分配与回收策略**<br/>
1、对象优先在新生代 Eden 区中分配，当 Eden 区没有足够空间进行分配时，虚拟机将发起一次新生代 GC<br/>
2、大对象（需要大量连续内存空间的 Java 对象）直接进入老年代<br/>
3、长期存活的对象将进入老年代（当对象的年龄（GC 的次数）增加到一定程度（默认为 15），那么就会被虚拟机认为是长期存活的对象，就会进入老年代）<br/>
4、动态对象年龄判定（虚拟机会结合对象大小总和与 Survivor 空间（担保）大小进行判断）<br/>
5、空间分配担保（就是判断老年代能否需要进行 GC 来配合新的对象进入老年代）<br/>

### 虚拟机类加载机制
- **定义**: Java 虚拟机把描述类的数据从 Class 文件加载到内存，并对数据进行校验、转换解析和初始化，最终形成可以被虚拟机直接使用的 Java 类型的过程（类型的加载、连接、初始化都是在程序运行期间完成的）这个特性虽然会让类在加载时增加一些性能开销，但却提供了极高的扩展性和灵活性，Java 可以动态扩展的语言特性就是依赖运行期动态加载和动态连接这个特点实现的<br/>
- **加载过程**: 一个类型从被加载到虚拟机内存中开始，到卸载出内存为止，它整个生命周期将会经历加载(loadinng) -> 验证(verification) -> 准备(preparation) -> 解析(resolution) -> 初始化(initialization) -> 使用(using) -> 卸载(unloading)（验证 -> 准备 -> 解析这三部分统称为连接(linking)），**解析**阶段的加载过程会根据实际情况，可以在初始化阶段之后再开始（为了支持 Java 语言的运行时绑定特性）<br/>
- **加载**: 需要完成1、通过一个类的全名来获取定义此类的二进制字节流; 2、将这个字节流所代表的静态存储结构转化为方法区的运行时数据结构; 3、在内存中生成一个代表这个类的 java.lang.Class 对象，作为方法区这个类的各种数据的访问入口<br/>
非数组类型的加载阶段，既可以使用 Java 虚拟机里内置的引导类加载器来完成，也可以由用户自定义的类加载器来完成<br/>
数组类型本身不通过类加载器创建，是由 Java 虚拟机直接在内存中动态构造出来，数组类的元素类型最终还是需要靠类加载器来完成加载<br/>
加载阶段结束后，Java 虚拟机外部的二进制字节流会按照虚拟机所设定的格式存储在方法区中，方法区中的数据存储格式全由虚拟机实现自行定义，类型数据存在方法区后，会在 Java 堆内存中实例化一个 java.lang.Class 类的对象，这个对象将作为程序访问方法区中的类型数据的外部接口<br/>
加载阶段与连接阶段（如一部分字节码文件格式验证动作）的部分动作是交叉进行的，加载阶段还未完成，连接阶段就可能已经开始（这些夹在加载阶段中进行的动作，仍然属于连接阶段的一部分，这两阶段的开始时间仍然保持着固定的先后顺序）<br/>
- **验证**: 目的是确保 Class 文件的字节流中包含的信息符合《Java虚拟机规范》的全部约束要求，保证这些信息被当作代码运行后不会危害虚拟机自身的安全。主要就是为了检查输入的字节流，避免因载入了有错误或由恶意企图的字节码流而导致整个系统受攻击甚至崩溃，这一阶段是 Java 虚拟机保护自身的一项必要措施<br/>
验证阶段大致会分为以下四个检验动作: 文件格式验证、元数据验证、字节码验证和符号引用验证<br/>
- **准备**: 正式为类中定义的变量（静态变量）分配内存并设置类变量初始值的阶段，此时进行内存分配的仅包括类变量，而不包括实例变量（将会在对象实例化时随着对象一起分配在 Java 堆中），另外一般情况下，准备阶段时仅会给变量赋初始值（因为此时尚未开始执行任何 Java 方法，赋值的指令是程序被编译后存放在类构造器中，所以赋值操作是要到类的初始化阶段才会被执行），特殊情况（如声明静态变量为 final 类型）下，在准备阶段就会将值赋静态变量<br/>
- **解析**: 是 Java 虚拟机将常量池内的符号引用替换为直接引用的过程。解析动作主要针对类或接口、字段、类方法、接口方法、方法类型、方法句柄和调用点限定符这七类符号引用进行。解析时机由虚拟机自行实现。<br/>
符号引用: 以一组符号来描述所引用的目标，可以是任何形式的字面量，只要使用时能无歧义地定位到目标即可，符号引用与虚拟机实现的内存布局无关，引用的目标并不一定是已经加载到虚拟机内存当中的内容<br/>
直接引用: 可以直接指向目标的指针、相对偏移量或是一个能间接定位到目标的句柄。直接引用是和虚拟机实现的内存布局直接相关的，同一个符号引用在不同虚拟机实力上翻译出来的直接引用一般不会相同，如果有了直接引用，那引用的目标必定已经在虚拟机的内存中存在<br/>
- **初始化**: 是类加载过程的最后一个步骤，之前的动作里，除了在加载阶段用户应用程序可以通过自定义类加载器的方式局部参与外，其余动作都完全由 Java 虚拟机来主导控制。直到初始化阶段，Java 虚拟机才真正开始执行类中编写的 Java 程序代码，将主导权移交给应用程序。在这个阶段会真正初始化类变量和其他资源。初始化阶段是执行类构造器的过程（通过 <clinit>()，这个方法是 Javac 编译器的自动生成物），这个方法由编译器自动收集类中的所有类变量的赋值动作和静态语句块（static {} 块）中的语句合并产生，编译器收集的顺序是由语句在源文件中出现的顺序决定的，静态语句块中只能访问到定义在静态语句块之前的变量，定义在它之后的变量，在前面的静态语句块可以赋值，但不能访问。<br/>
- **类加载器**: 用于实现通过一个类的全限定名来获取描述该类的二进制字节流（即用于实现类的加载动作）<br/>
- **类**: 对于任意一个类，都必须由加载它的类加载器和这个类本身一起共同确立其在 Java 虚拟机中的唯一性，每一个类加载器都拥有一个独立的类名称空间（判断两个类是否相等，只有在这两个类是由一个类加载器加载的前提下才有意义，否则即使两个类来源于同一个 Class 文件，被同一个 Java 虚拟机加载，只要加载它们的类加载器不同，那这两个类就一定不相等，类相等是指类的 Class 对象的 equals()、isAssignableFrom()、isInstance() 的返回结果，也包括使用 instanceof 关键字做对象所属关系判定等各种情况）<br/>
- **双亲委派模型**: Java 虚拟机的角度来看只会存在两种不同的类加载器: 一种是启动类加载器（Bootstrap ClassLoader 由 c++ 实现，是虚拟机自身的一部分），另一种是其他所有的类加载器（由 Java 实现，独立存在与虚拟机外部，并且都继承自 java.lang.ClassLoader）。双亲委派模型的工作过程: 如果一个类加载器收到了类加载的请求，首先不会自己尝试加载这个类，而是把这个请求委派给父类加载器去完成，每一个层次的类加载器都是这样工作，因此所有的加载请求最终都应该传送到最顶层的启动类加载器中，只有当父加载器反馈自己无法完成这个加载请求时，子加载器才会尝试自己完成加载。（这种模型保证了 Java 程序的稳定运作，因为避免因开发者写出同名的 Object 类导致加载被阻隔等问题）<br/>

### 执行引擎
- **功能**: 输入字节码二进制流，进行字节码解析执行，输出执行结果<br/>
- **运行时栈帧结构**: Java 虚拟机以方法作为最基本的执行单元，栈帧（Stack Frame）是用于支持虚拟机进行方法调用和方法执行背后的数据结构，也是虚拟机运行时数据区中的虚拟机栈的栈元素。栈帧存储了方法的局部变量表、操作数栈、动态连接和方法返回地址等信息。一个栈帧需要分配多少内存并不会收到程序运行期变量数据的影响，而仅仅取决于程序源码和具体的虚拟机实现的栈内存布局形式。（执行引擎只会将位于栈顶的方法视为在运行状态的）<br/>
- **局部变量表**: 是一组变量值的存储空间，用于存放方法参数和方法内部定义的局部变量。在 Java 程序被编译为 Class 文件时就确定了该方法所需要分配的局部变量表的最大容量。最小单位以变量槽（Variable Slot）为最小单位（但 Java 虚拟机规范中并没有明确指出一个变量槽应占用的内存空间大小，知识说每个变量槽都应该能存放一个基本类型、引用类型），局部变量在 Java 中定义后需要赋初值，否则是不可用的<br/>
- **操作数栈（操作栈，是个后进先出的栈）**: 与局部变量表一样，操作数栈的最大深度也在编译时就确定了。编译器会保证操作数栈的深度不会超过 max_stacks 数据项中设定的最大值<br/>
- **动态连接**: 符号引用在每次运行期间都转化为直接引用的过程。每个栈帧都包含一个指向运行时常量池中该栈帧所属方法的引用，持有这个引用是为了支持方法调用过程中的动态连接。
- **方法返回地址**: 当一个方法开始执行后，只有两种方式退出这个方法。1、执行引擎遇到任意一个方法返回的字节码指令（正常调用完成，会给它的上层调用者返回信息，如果有需要返回的话）；2、方法在执行过程中遇到了异常，并且这个异常没有在方法体内得到处理时就会导致方法退出（异常调用完成，不会给上层调用者返回相关信息）<br/>
- **方法调用**: 不等同于方法中的代码被执行，此阶段唯一的任务是确定被调用方法的版本（即调哪一个方法），不会设计方法内部的具体运行过程。
- **动态类型语言**: 关键特征是它的类型检查的主体过程是在运行期而不是编译期进行。

### Java 内存模型与线程
- **主内存与工作内存**: Java 内存模型的主要目的是定义程序中各种变量的访问规则，即关注在虚拟机中把变量值存储到内存和从内存中取出变量值（包括实例字段、静态字段和构成数组对象的元素，但不包括局部变量和方法参数，因为他们是线程私有的，不会被共享）的底层细节。<br/>
Java 内存模型规定了所有的变量都存储在主内存（是虚拟机内存的一部分）中。每条线程拥有自己的工作内存（类比于处理器高速缓存），线程的工作内存中保存了被该线程使用的变量的主内存副本，线程对变量的所有操作（读取、赋值）都必须在工作内存中进行，而不能直接读写主内存中的数据。不同的线程之间也无法直接访问对方工作内存中的变量，线程间变量值的传递均需要通过主内存来完成。<br/>
- **内存间交互操作**: 即一个变量如何从主内存拷贝到工作内存，如何从工作内存同步回主内存这一类的实现，Java 内存模型定义了 8 种操作（这些操作必须是原子的、不可再分的）<br.>
lock（锁定）: 作用于主内存的变量，把一个变量标识为一条线程独占的状态<br/>
unlock（解锁）: 作用于主内存的变量，把一个处于锁定状态的变量释放出来，释放后的变量才可以被其他线程锁定<br/>
read（读取）: 作用于主内存的变量，把一个变量的值从主内存传输到线程的工作内存中，以便随后的 load 动作使用<br/>
load（载入）: 作用于工作内存的变量，把 read 操作从主内存中得到的变量值放入工作内存的变量副本中<br/>
use（使用）: 作用于工作内存的变量，把工作内存中一个变量的值传递给执行引擎，每当虚拟机遇到一个需要使用变量的值的字节码指令时将会执行这个操作<br/>
assign（赋值）: 作用于工作内存的变量，把一个从执行引擎接收的值赋给工作内存的变量，每当虚拟机遇到一个给变量赋值的字节码指令时执行这个操作<br/>
store（存储）: 作用于工作内存的变量，把工作内存中一个变量的值传送到主内存中，以便随后的 write 操作使用<br/>
write（写入）: 作用于主内存的变量，把 store 操作从工作内存中得到的变量的值放入主内存的变量中<br/>
Java 内存模型还规定了再执行以上 8 种基本操作时必须满足如下规则:<br/>
1、不允许 read 和 load、store 和 write 操作之一单独出现（不允许一个变量从主内存读取了但工作内存不接受，或工作内存发起回写了但主内存不接受的情况出现）<br/>
2、不允许一个线程丢弃它最近的 assign 操作（变量在工作内存中改变了之后必须把该变化同步回主内存）<br/>
3、不允许一个线程无原因地（没有发生过任何 assign 操作）把数据从线程的工作内存同步回主内存中<br/>
4、一个新的变量只能在主内存中“诞生”，不允许在工作内存中直接使用一个未被初始化（load / assign）的变量（就是对一个变量使用 use、store 之前必须先执行 assign 和 load）<br/>
5、一个变量在同一时刻只允许一条线程对其进行 lock 操作，但 lock 操作可以被同一条线程重复执行多次，多次执行 lock 后，只有执行相同次数的 unlock 操作，变量才会被解锁<br/>
6、如果对一个变量执行 lock 操作，那将会清空工作内存中此变量的值，在执行引擎使用这个变量前，需要重新执行 load / assign 操作以初始化变量的值<br/>
7、如果一个变量事先没有被 lock 操作锁定，那就不允许对它执行 unlock 操作，也不允许去 unlock 一个被其他线程锁定的变量<br/>
8、对一个变量执行 unlock 操作之前，必须先把此变量同步回主内存中（执行 store、write 操作）
- **volatile 型变量的特殊规则**: 是 Java 虚拟机提供的最轻量级的同步机制。当一个变量被定义成 volatile 后，它将具备两项特性: 1、保证此变量对所有线程的可见性（指当一条线程修改了这个变量的值，新值对于其他线程来说是可以立即得知的，而普通变量在线程间传递则需要主内存来完成）<br/>
由于 volatile 变量只能保证可见性，在不符合一下两条规则的运算场景中，仍然要通过枷锁（synchronized、java.util.concurrent 中的锁或原子类）来保证原子性: 1) 运算结果并不依赖变量的当前值，或能够确保只有单一的线程修改变量的值; 2) 变量不需要与其他的状态变量共同参与不变约束;<br/>
2、能够禁止指令重排序优化，普通变量仅会保证在该方法的执行过程中所有依赖赋值结果的地方都能获取到正确的结果，而不能保证变量赋值操作的顺序与程序代码中的执行顺序一致（因为在同一个线程的方法执行过程中无法感知到这点，即线程内表现为串行的语义）<br/>
volatile 变量读操作的性能消耗与普通变量几乎没有差别，但写操作则可能会慢一些，因为它需要在本地代码中插入许多内存屏障指令来保证处理器不发生乱序执行。<br/>
- **针对 long 和 double 型变量的特殊规则**: Java 内存模型要求主内存与工作内存之间的数据同步的八种操作都具有原子性，但对于 64 位的数据类型（long 和 double），在模型中定义了一条宽松的规定: 允许虚拟机将没有被 volatile 修饰的 64 位数据的读写操作划分为 32 位的操作来进行，即允许虚拟机实现自行选择是否要保证 64 位数据类型 的 load、store、read 和 write 这四个操作的原子性（long 和 double 的非原子性协定）。目前一般不需要因为这个原因刻意把用到的 long 和 double 变量专门声明为 volatile<br/>
- **原子性、可见性、有序性**:<br/> 
原子性（Atomicity）: 由 Java 内存模型直接保证的原子性变量操作包括 read、load、assign、use、store 和 write 这六个，可以认为基本数据类型的访问、读写都具备原子性的（除了 long 和 double 的非原子性协定）。如果应用场景需要一个更大范围的原子性保证，Java 内存模型还提供了 lock 和 unlock 操作来满足这种需求，尽管虚拟机未把 lock 和 unlock 操作直接开放给用户使用，但提供了更高层次的字节码指令 monitorenter 和 monitorexit 来隐式地使用这两个操作。这两个字节码指令反映到 Java 代码中就是同步块（synchronized，所以 synchronized 代码块的操作具备原子性）<br/>
可见性（Visibility）: 指当一个线程修改了共享变量的值时，其他线程能够立即得知这个修改。Java 内存模型是通过在变量修改后将新值同步回主内存，在变量读取前从主内存刷新变量值这种依赖主内存作为传递媒介的方式来实现可见性的，无论是普通变量还是 volatile 变量都是这样。普通变量和 volatile 变量的区别是，volatile 的特殊规则保证了新值能立即同步到主内存，以及每次使用前立即从主内存刷新。所以可以说 volatile 保证了多线程操作时变量的可见性，而普通变量不能保证这一点。除了 volatile 外，Java 还有两个关键字可以实现可见性，分别是 synchronized 和 final。同步块 synchronized 的可见性是由“对一个变量执行 unlock 操作之前，必须先把此变量同步回主内存中（执行 store、write 操作）”这条规则获得。而 final 关键字的可见性是指: 被 final 修饰的字段在构造器中一旦初始化完成，并且构造器没有把 this 的引用传递出去，那么在其他线程中就能看见 final 字段的值。<br/>
有序性（Ordering）: 如果在本线程内观察，所有的操作都是有序的（线程内串行）；如果在一个线程中观察另一个线程，所有的操作都是无序的（指令重排现象和工作内存与主内存同步延迟现象）。Java 语言提供了 volatile 和 synchronized 两个关键字来保证线程之间操作的有序性，volatile 关键字本身就包含了禁止指令重排序的语义，而 synchronized 则是由“一个变量在同一时刻只允许一条线程对其进行 lock 操作”这条规则获得的，这个规则决定了持有同一个锁的两个同步块只能串行地进入。<br/>
- **先行发生原则**: 是判断数据是否存在竞争，线程是否安全的有效手段。先行发生是 Java 内存模型中定义的两项操作之间的偏序关系，如操作 A 先行发生于操作 B，其实就是说在发生操作 B 之前，操作 A 产生的影响能被操作 B 观察到，“影响”包括修改了内存中共享变量的值、发送了消息、调用了方法等。<br/>
Java 内存模型的一些“天然的”（无需同步手段就能保证）先行发生关系: <br/>
程序次序规则（Program Order Rule）: 在一个线程内，按照控制流顺序，书写在前面的操作先行发生于书写在后面的操作（控制流顺序不是程序代码顺序，因为要考虑分支、虚幻等结构）。<br/>
管程锁定规则（Monitor Lock Rule）: 一个 unlock 操作先行发生于后面（时间上的先后）对同一个锁的 lock 操作。<br/>
volatile 变量规则（Volatile Variable Rule）: 对一个 volatile 变量的写操作先行发生于后面（时间上的先后）对这个变量的读操作。<br/>
线程启动规则（Thread Start Rule）: Thread 对象的 start() 先行发生于此线程的每一个动作。<br/>
线程终止规则（Thread Termination Rule）: 线程中的所有操作都先行发生于对此线程的终止检测，可以通过 Thread::join() 是否结束、Thread::isAlive() 的返回值等手段检测线程是否已经终止执行。<br/>
线程中断规则（Thread Interruption Rule）: 对线程 interrupt() 的调用先行发生于被中断线程的代码检测到中断事件的发生，可以通过 Thread：：interrupted() 检测到是否有中断发生。<br/>
对象终结规则（Finalized Rule）: 一个对象的初始化完成（构造函数执行结束）先行发生于它的 finalize() 方法的开始。<br/>
传递性（Transitivity）: 如果操作 A 先行发生于操作 B，操作 B 先行发生于操作 C，那就可以得出操作 A 先行发生于操作 C 的结论。<br/>
需要注意的是时间先后顺序与先行发生原则之间基本没有因果关系，所以衡量并发安全问题的时候不要受时间顺序的干扰，一切须以先行发生原则为准。<br/>
- **线程的实现**: Java 中每个已经调用过 start() 且还未结束的 java.lang.Thread 类的实例就代表一个线程。以通用的应用程序的角度来说，实现线程的三种方式: 使用内核线程实现（1:1 实现），使用用户线程实现（1:N 实现），使用用户线程加轻量级进行混合实现（N:M 实现）。<br/>
- **Java 线程调度**: 指系统为线程分配处理器使用权的过程，主要方式分别是协同式（Cooperative Thread-Scheduling）线程调用和抢占式（Preemptive Threads-Scheduling）线程调度。<br/>
协同式调度，线程的执行时间由线程本身控制，线程将自己的工作执行完后要主动通知系统切换到两一个线程（好处: 因为线程要将完成自己的工作后才进行线程切换，是自身可知的，所以一般没有线程同步的问题，坏处: 线程执行时间不可控制，如果线程内执行逻辑有问题，则会一直阻塞着不会告知系统进行线程切换）<br/>
抢占式调度，每个线程将由系统来分配执行时间，线程的切换不由线程本身决定。（Java 使用的线程调度方式就是抢占式调度，可以使用 Thread.yield() 主动让出执行时间，但线程本身没有方法主动获取执行时间）。虽然 Java 线程调度是由系统完成，但可以通过设置线程优先级让系统给优先级高的线程多分配执行时间，那么两个线程同时处于 Ready 状态时，优先级越高的线程越容易被系统选择执行。<br/>


























