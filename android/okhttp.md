---
title: Okhttp 篇
display: home
description: android okhttp
image: https://picsum.photos/536/354?random&date=2021-07-02
date: 2021-07-02
vssue-title: android okhttp
tags:
  - knowledge
categories:
  - android
---

# 大纲

* [前言](#前言)
* [概述](#概述)
* [基本用法](#基本用法)
* [基础篇小结](#基础篇小结)
* [源码篇](#源码篇)
* [源码篇小结](#源码篇小结)
* [思考](#思考)
* [参考资料](#参考资料)

## 前言
文章是跟这 OkHttp 的源码去读的，结合了网上其它的总结资料，写完后篇幅确实比 Retrofit 长... 先说一下本人的源码阅读流程，还是根据调用开始阅读，从构建到调用，开始从同步调用的方式进入，到责任链，再返回到结束。然后再从异步调用的方式进入，发现同步和异步的区别是在进入责任链之前就区分好了，方法入口不一样，到责任链环节的时候流程大致是一致的，但异步调用的话，责任链的返回时通过回调的方式而已。所以本篇在源码篇上的排版顺序调整了一下（原先是按照我阅读的方式同步调用 -> 结束，异步调用 -> 结束），将两种调用方式先放到前面，然后将责任链的流程按每个拦截器分小点，方便阅读。

## 概述
HTTP 是现代应用网络请求用于交换数据和媒体资源的方式，有效执行 HTTP 可以让内容家在速度更快且能节省带宽。<br/>
OkHttp 则是一个高效的 HTTP 客户端，它具备以下特点
- HTTP/2 支持允许对同一主机的所有请求共享一个套接字
- 连接池减少请求延迟（如果 HTTP/2 不可用）
- 透明 GZIP 可缩小下载大小
- 响应缓存完全避免网络重复请求

OkHttp 在网络出现问题时，会从常见的连接问题中默默恢复。如果服务存在多个 IP 地址，那么 OkHttp 会在第一次连接失败时尝试备用地址。这对于在冗余数据中心托管的 IPv4+IPv6 和服务是必需的。OkHttp 支持现在 TLS 功能（TLS 1.3、ALPN、证书锁定）。可以配置为回退以实现广泛的连接。<br/>
OkHttp 的请求/响应 API 设计有流畅的构建器和不变性。支持同步阻塞调用和带有回调的异步调用。（依赖于 Okio 和 Kotlin 标准库）<br/>
硬生生地翻译了一下[官方文档](https://square.github.io/okhttp/)... 大概了解到 OkHttp 的基本作用，接下来看看它怎么用吧

## 基本用法
依赖引入: `implementation("com.squareup.okhttp3:okhttp:4.9.0")`<br/>
获取一个 URL 的内容
```
public class GetExample {
  // 创建 OkHttpClient
  OkHttpClient client = new OkHttpClient();

  String run(String url) throws IOException {
    // 创建 Request
    Request request = new Request.Builder()
        .url(url)
        .build();

    // client.newCall 发起请求（很熟悉吧，在 Retrofit 中也通过 Call 发起请求）
    try (Response response = client.newCall(request).execute()) {
      // 返回结果，string() 调用一次后，会将流关闭
      return response.body().string();
    }
  }

  public static void main(String[] args) throws IOException {
    GetExample example = new GetExample();
    String response = example.run("https://raw.github.com/square/okhttp/master/README.md");
    System.out.println(response);
  }
}
```
往服务器推送数据
```
// 指定请求的 MediaType
public static final MediaType JSON
    = MediaType.get("application/json; charset=utf-8");

// 构造 client
OkHttpClient client = new OkHttpClient();

String post(String url, String json) throws IOException {
  // 构造 RequestBody（参数）
  RequestBody body = RequestBody.create(JSON, json);
  // 构造 Request
  Request request = new Request.Builder()
      .url(url)
      .post(body)
      .build();
  // 发起请求
  try (Response response = client.newCall(request).execute()) {
    // 返回结果
    return response.body().string();
  }
}
```
上面两个例子，属于同步请求，会进入阻塞状态并等待直接结果返回，下面看一个异步请求
```
//1 请求的 Client
val okHttpClient = OkHttpClient()
//2 构造出一个 Request 对象
val request = Request.Builder()
    //API 接口由 wanandroid.com 提供
    .url("https://wanandroid.com/wxarticle/chapters/json")
    .get()
    .build()
//3 创建出一个执行的 Call 对象
val call = okHttpClient.newCall(request)
//4 异步执行请求
call.enqueue(object : Callback {
    override fun onFailure(call: Call, e: IOException) {
        // 失败回调
        e.printStackTrace()
    }

    override fun onResponse(call: Call, response: Response) {
        // 成功回调
        "response.code = ${response.code}".log()
    }
})
```


## 基础篇小结
看过上面的 demo，OkHttp 的使用就是这样简简单单，先构造一个 OkHttpClient，还得有一个请求体 Request，如果有参数就构造一个 RequestBody（要指定 MediaType，网络请求的基础），再通过 OkHttpClient 创建一个 Call 实例（client.newCall），同步的话就调用 execute()，异步的话就调用 enqueue()，拿到 Response，那这一次的请求就完成了。<br/>
单从基本用法上，看不出网络请求的详细信息，不是有请求方法的区分吗？不是有超时机制吗？该怎么配置？同步异步的切换是怎么做到的...<br/>
那就看看他怎么是实现的吧<br/>

## 源码篇

### OkHttpClient
按照习惯，从调用的地方开始
```
OkHttpClient client = new OkHttpClient();

OkHttpClient.kt

// OkHttpClient 无参构造方法直接通过 Builder 创建出来
constructor() : this(Builder())
```
OkHttpClient 的实例也是通过构建者模式创建，Builder 中包含了一系列配置
```
Builder

// 从 Builder 中可以了解到如果想要配置参数，在创建的时候指定行
class Builder constructor() {
    // 分发器，用于何时执行请求的策略
    internal var dispatcher: Dispatcher = Dispatcher()
    // 连接池，管理 HTTP 和 HTTP/2 连接的重用以减少网络延迟
    // 相同的 HTTP 地址肯能会共享同一个连接
    internal var connectionPool: ConnectionPool = ConnectionPool()
    // 拦截器列表，用于观察、修改和短链请求和相应的返回响应
    // 通常拦截器会添加、删除或转换请求或响应的头部信息
    internal val interceptors: MutableList<Interceptor> = mutableListOf()
    internal val networkInterceptors: MutableList<Interceptor> = mutableListOf()
    // 指标事件监听器，用于监控应用的 HTTP 调用数量、大小和持续时间（工厂模式）
    internal var eventListenerFactory: EventListener.Factory = EventListener.NONE.asFactory()
    // 连接失败后是否尝试重连
    internal var retryOnConnectionFailure = true
    // 服务器身份验证
    internal var authenticator: Authenticator = Authenticator.NONE
    // 是否允许重定向
    internal var followRedirects = true
    // 是否允许 ssl 重定向
    internal var followSslRedirects = true
    // HTTP Cookie
    internal var cookieJar: CookieJar = CookieJar.NO_COOKIES
    // HTTP 缓存（存到文件中以便重用，从而节省时间和带宽）
    internal var cache: Cache? = null
    // 域名管理系统
    internal var dns: Dns = Dns.SYSTEM
    // 代理设置（通常是 http 或者 socks 和一个套接字地址）
    internal var proxy: Proxy? = null
    // 代理选择器
    internal var proxySelector: ProxySelector? = null
    // 代理服务器身份验证
    internal var proxyAuthenticator: Authenticator = Authenticator.NONE
    // socket 工厂
    internal var socketFactory: SocketFactory = SocketFactory.getDefault()
    // ssl socket 工厂
    internal var sslSocketFactoryOrNull: SSLSocketFactory? = null
    // ssl 握手异常管理
    internal var x509TrustManagerOrNull: X509TrustManager? = null
    // 传输层版本和连接协议（默认支持 HTTP 和 HTTPS
    internal var connectionSpecs: List<ConnectionSpec> = DEFAULT_CONNECTION_SPECS
    // HTTP 协议（默认 HTTP_2, HTTP_1_1）
    internal var protocols: List<Protocol> = DEFAULT_PROTOCOLS
    // 主机名字确认
    internal var hostnameVerifier: HostnameVerifier = OkHostnameVerifier
    // 证书链
    internal var certificatePinner: CertificatePinner = CertificatePinner.DEFAULT
    // 证书清理链
    internal var certificateChainCleaner: CertificateChainCleaner? = null
    // 默认呼叫超时时间内（毫秒），默认情况下完整调用没有超时
    // 主要用于调用中的连接、写入和读取操作
    internal var callTimeout = 0
    // 连接超时（默认 10 秒）超时时间在创建的时候就指定了
    internal var connectTimeout = 10_000
    // 读取超时（默认 10 秒）
    internal var readTimeout = 10_000
    // 写入超时（默认 10 秒）
    internal var writeTimeout = 10_000
    // web sockt 和 HTTP/2 ping 操作的间隔（单位: 毫秒）
    // 默认情况下不发送 ping
    internal var pingInterval = 0
    // web sockt 最小应该被压缩的值
    internal var minWebSocketMessageToCompress = RealWebSocket.DEFAULT_MINIMUM_DEFLATE_SIZE
    // 路由黑名单，如果尝试连接到一个特定的 IP 或代理服务器出现错误
    // 那么该路由信息将被记录作为备用路由
    internal var routeDatabase: RouteDatabase? = null

    // ...
}
```
说实话，有点劝退，Builder 里的属性很多，光每个点击去看看注释都花了小半小时，但是了解框架还是先看主流程，把开始对这个库的疑云扫清，其它细节可以慢慢看... 既然 OkHttpClient 的创建看完，那就看看 Request 吧（毕竟是第二步）

### Request

```
/**
 * 相比之下这个类就简单一些
 * url 请求的 url
 * method 请求的方法默认是 GET（方法在这里指定）
 * headers 头部信息（键值对），它的键值对用 List 存取，有点东西...
 * body 请求体
 * 在使用的过程中，按需传入
 */
class Request internal constructor(
  @get:JvmName("url") val url: HttpUrl,
  @get:JvmName("method") val method: String,
  @get:JvmName("headers") val headers: Headers,
  @get:JvmName("body") val body: RequestBody?,
  internal val tags: Map<Class<*>, Any>
) {
  // ...
}
```
Request 的构建比较常规，都是一些基本的请求参数，值得注意的是 Header 的存储虽说在平时传入的时候是以键值对的形式传入，但他内部有将键值对转换成字符串 List 的逻辑，所以能在请求是 Header 写入是一串字符串。接下来就是在 Retrofit 中看到过的 newCall 操作，OkHttpClient 实现了 Call.Factory 接口，重写返回了 RealCall 的实例，代码如下
```
OkHttpClient.kt

// 也就是说 execute 和 enqueue 的逻辑都在 RealCall 中，那么就看看这里的代码吧
/** Prepares the [request] to be executed at some point in the future. */
override fun newCall(request: Request): Call = RealCall(this, request, forWebSocket = false)
```
剩下的，就是同步发起请求和异步发起请求了，来看看 RealCall 这个类中做了什么。按顺序<br/>
execute()，此方法前置知识点 [Kotlin 契约](https://www.kotlincn.net/docs/reference/whatsnew13.html) 和 AtomicBoolean（采用 CAS 方法，高并发下只有一个线程能访问该属性值）<br/>
enqueue()，需要了解一下 ThreadPoolExecutor

### 同步请求

```
RealCall.kt

/**
 * client 请求 client
 * originalRequest 请求参数
 * forWebScoket 默认不是 web socket 请求
 * 通过 newCall 后拿到 Call 的实例，分为同步请求 execute(), 异步请求 enqueue()
 */
class RealCall(
  val client: OkHttpClient,
  /** The application's original request unadulterated by redirects or auth headers. */
  val originalRequest: Request,
  val forWebSocket: Boolean
) : Call {
  // ...
  
  /**
   * 同步请求方法
   * 这方法没有入参，返回值是 Response
   * 这个方法在做了一些前置逻辑后，实际的执行在 callStart() 后
   * 通过 Dispatcher 来执行请求，那么去 Dispatcher 中看看相关的代码
   */
  override fun execute(): Response {
    // 检查 executed 这个变量是否可以从 false 改为 true，不能就抛出异常
    check(executed.compareAndSet(false, true)) { "Already Executed" }

    // timeout 是 AsyncTimeout，在后台线程中准确执行超时操作
    timeout.enter()
    // 事件回调，请求开始
    callStart()
    try {
      // 调用 dispatcher#executed 将 RealCall 传禁区
      client.dispatcher.executed(this)
      // 从拦截链获取 Response 并返回（就是服务器返回的响应）
      return getResponseWithInterceptorChain()
    } finally {
      // 结束请求
      client.dispatcher.finished(this)
    }
  }
}

Dispatcher.kt

/**
 * 是个普通的类
 */
class Dispatcher constructor() {
  
  // ...
  
  /**
   * 双向队列，线程不安全，容量不足会自动扩容
   * 每添加一个元素都会将其加到数组的尾部，head 指针不变，tail 指针加一
   * 因为指针是循环家的，所以当 tail 追上 head 时会进行扩容（扩大一倍）
   * (this.tail = this.tail + 1 & this.elements.length - 1) == this.head
   * 这个队列使用记录正在运行的同步请求（包括已经取消和没有完成的）
   */
  /** Running synchronous calls. Includes canceled calls that haven't finished yet. */
  private val runningSyncCalls = ArrayDeque<RealCall>()
  
  // ...
  
  /**
   * executed 方法将 RealCall 实例放到了一个双向队列中
   * @Synchronized 跟 Java 中 synchronized 关键字一样的作用
   * 没错 Kotlin 把 Java 中并发相关的关键字都去掉了，使用注解代替
   * 可是 executed() 方法仅是将 call 放到队列中
   * 所以还得看看怎么拿到真正的 Response
   * 还得回到 RealCall 中看看 getResponseWithInterceptorChain
   */
  /** Used by [Call.execute] to signal it is in-flight. */
  @Synchronized internal fun executed(call: RealCall) {
    runningSyncCalls.add(call)
  }
}
```

### 异步请求

接下来再看看异步调用 enqueue() 
```
RealCall.kt

override fun enqueue(responseCallback: Callback) {
  check(executed.compareAndSet(false, true)) { "Already Executed" }

  // 回调监听
  callStart()
  // 调用 dispatcher#enqueue，入为 AsyncCall 并带上了一个 responseCallback
  client.dispatcher.enqueue(AsyncCall(responseCallback))
}

Dispatcher.kt

internal fun enqueue(call: AsyncCall) {
  synchronized(this) {
    // 将 AsyncCall 实例添加到 readyAsyncCalls list 中
    readyAsyncCalls.add(call)

    // Mutate the AsyncCall so that it shares the AtomicInteger of an existing running call to
    // the same host.
    if (!call.call.forWebSocket) {
      val existingCall = findExistingCallWithHost(call.host)
      if (existingCall != null) call.reuseCallsPerHostFrom(existingCall)
    }
  }
  // 执行
  promoteAndExecute()
}

private fun promoteAndExecute(): Boolean {
  this.assertThreadDoesntHoldLock()

  // 声明 AsyncCall 集合（表示可以被执行的请求）
  val executableCalls = mutableListOf<AsyncCall>()
  val isRunning: Boolean
  synchronized(this) {
    // 开始遍历 readyAsyncCalls 集合
    val i = readyAsyncCalls.iterator()
    while (i.hasNext()) {
      val asyncCall = i.next()

      if (runningAsyncCalls.size >= this.maxRequests) break // Max capacity.
      if (asyncCall.callsPerHost.get() >= this.maxRequestsPerHost) continue // Host max capacity.

      i.remove()
      // 将拿到 AsyncCall 存到 executableCalls 集合中
      asyncCall.callsPerHost.incrementAndGet()
      executableCalls.add(asyncCall)
      runningAsyncCalls.add(asyncCall)
    }
    isRunning = runningCallsCount() > 0
  }

  // 遍历 executableCalls 集合并调用每个 asyncCall#executeOn()
  // executorService 是 ExecutorService 类型的线程池，用于执行后台任务
  // 没有核心线程，非核心线程不限，闲置的时候，一分钟后会被回收（ThreadPoolExecutor）
  for (i in 0 until executableCalls.size) {
    val asyncCall = executableCalls[i]
    asyncCall.executeOn(executorService)
  }

  return isRunning
}

RealCall.kt（AsyncCall 是 RealCall 的 inner class）

/**
 * Attempt to enqueue this async call on [executorService]. This will attempt to clean up
 * if the executor has been shut down by reporting the call as failed.
 */
fun executeOn(executorService: ExecutorService) {
  client.dispatcher.assertThreadDoesntHoldLock()

  var success = false
  try {
    // 执行 AsyncCall（是个 Runnable）
    executorService.execute(this)
    success = true
  } catch (e: RejectedExecutionException) {
    val ioException = InterruptedIOException("executor rejected")
    ioException.initCause(e)
    noMoreExchanges(ioException)
    // 线程池任务满了，拒绝执行，抛异常直接回调失败
    responseCallback.onFailure(this@RealCall, ioException)
  } finally {
    if (!success) {
      client.dispatcher.finished(this) // This call is no longer running!
    }
  }
}

override fun run() {
  threadName("OkHttp ${redactedUrl()}") {
    var signalledCallback = false
    timeout.enter()
    try {
      // 也是通过责任链 getResponseWithInterceptorChain
      val response = getResponseWithInterceptorChain()
      signalledCallback = true
      // 通过 responseCallback 将 response 返回
      responseCallback.onResponse(this@RealCall, response)
    } catch (e: IOException) {
      if (signalledCallback) {
        // Do not signal the callback twice!
        Platform.get().log("Callback failure for ${toLoggableString()}", Platform.INFO, e)
      } else {
        // 异常回调
        responseCallback.onFailure(this@RealCall, e)
      }
    } catch (t: Throwable) {
      cancel()
      if (!signalledCallback) {
        val canceledException = IOException("canceled due to $t")
        canceledException.addSuppressed(t)
        // 异常回调
        responseCallback.onFailure(this@RealCall, canceledException)
      }
      throw t
    } finally {
      client.dispatcher.finished(this)
    }
  }
}
```
可以看到，异步调用是通过线程池执行 AsyncCall 这个 Runnable 开启责任链的，然后责任链拿到返回结果后再通过 responseCallback 以回调的形式将结果返回。同步调用没有开线程去请求，如果在 Android 使用的话，需要手动开个线程去执行。

### 责任链环节
同步请求和异步请求最终都会调用 getResponseWithInterceptorChain 进入到责任链环节建立连接并发起请求
```
RealCall.kt

// ...

/**
 * 这个方法中使用了传入的拦截器和一些默认拦截器
 * 然后构造出责任链实例进行处理（使用到责任链模式）
 * 每个拦截器负责相应的功能，整个请求过程就是通过一个个拦截器来使得请求完整
 * 并在服务器返回时，经过一个个拦截器处理后返回 Response
 */
@Throws(IOException::class)
internal fun getResponseWithInterceptorChain(): Response {
  // Build a full stack of interceptors.
  // 创建一个拦截器集合
  val interceptors = mutableListOf<Interceptor>()
  // 添加自定义的拦截器（在创建 OkHttpClient 时可以传入）
  // 可以配置公共参数，在请求之前
  interceptors += client.interceptors
  // 添加重试与重定向拦截器
  // 网络请求出错或服务器返回 301、302，会自动进行重定向
  interceptors += RetryAndFollowUpInterceptor(client)
  // 添加桥拦截器
  // 拼接成一个标准的 Http 协议请求，请求行，Header，Body 等
  interceptors += BridgeInterceptor(client.cookieJar)
  // 添加缓存拦截器
  // 根据 Header 进行网络缓存
  interceptors += CacheInterceptor(client.cache)
  // 添加连接拦截器
  // 开启一个目标服务器的连接
  interceptors += ConnectInterceptor
  if (!forWebSocket) {
    // 添加自定义的网络拦截器
    // 在请求结果返回时，对接口数据进行处理，如日志
    interceptors += client.networkInterceptors
  }
  // 添加服务器请求拦截器，请求服务器
  interceptors += CallServerInterceptor(forWebSocket)

  // 构建责任链
  // call 当前 RealCall 实例
  // interceptors 当前拦截器集合
  // index 当前拦截器集合索引
  // request 原始请求参数（未经过拦截器处理的）
  // 剩下的三个是超时时间（都有默认值）
  val chain = RealInterceptorChain(
      call = this,
      interceptors = interceptors,
      index = 0,
      exchange = null,
      request = originalRequest,
      connectTimeoutMillis = client.connectTimeoutMillis,
      readTimeoutMillis = client.readTimeoutMillis,
      writeTimeoutMillis = client.writeTimeoutMillis
  )

  var calledNoMoreExchanges = false
  try {
    // 处理责任链中的拦截器
    val response = chain.proceed(originalRequest)
    // 异常判断
    if (isCanceled()) {
      response.closeQuietly()
      throw IOException("Canceled")
    }
    return response
  } catch (e: IOException) {
    calledNoMoreExchanges = true
    throw noMoreExchanges(e) as Throwable
  } finally {
    if (!calledNoMoreExchanges) {
      noMoreExchanges(null)
    }
  }
}

//...
```

#### RealInterceptorChain
与远程 web 服务器的连接，能够承载 1 个或多个并发流。
```
RealInterceptorChain.kt

/**
 * Interceptor.Chain 的实现类
 */
class RealInterceptorChain(
  internal val call: RealCall,
  private val interceptors: List<Interceptor>,
  private val index: Int,
  internal val exchange: Exchange?,
  internal val request: Request,
  internal val connectTimeoutMillis: Int,
  internal val readTimeoutMillis: Int,
  internal val writeTimeoutMillis: Int
) : Interceptor.Chain {
  
  // ...
  
  @Throws(IOException::class)
  override fun proceed(request: Request): Response {
    check(index < interceptors.size)

    calls++

    if (exchange != null) {
      check(exchange.finder.sameHostAndPort(request.url)) {
        "network interceptor ${interceptors[index - 1]} must retain the same host and port"
      }
      check(calls == 1) {
        "network interceptor ${interceptors[index - 1]} must call proceed() exactly once"
      }
    }

    // 1、通过 copy() 拿到下一个 RealInterceptorChain 实例
    // copy 函数代码贴在下面
    // Call the next interceptor in the chain.
    val next = copy(index = index + 1, request = request)
    // 2、获取当前拦截器
    val interceptor = interceptors[index]

    // 3、调用当前拦截器的 intercept()，入参为下一个拦截器
    @Suppress("USELESS_ELVIS")
    val response = interceptor.intercept(next) ?: throw NullPointerException(
        "interceptor $interceptor returned null")

    if (exchange != null) {
      check(index + 1 >= interceptors.size || next.calls == 1) {
        "network interceptor $interceptor must call proceed() exactly once"
      }
    }

    check(response.body != null) { "interceptor $interceptor returned a response with no body" }

    return response
  }
  
  // ...
  
  internal fun copy(
    index: Int = this.index,
    exchange: Exchange? = this.exchange,
    request: Request = this.request,
    connectTimeoutMillis: Int = this.connectTimeoutMillis,
    readTimeoutMillis: Int = this.readTimeoutMillis,
    writeTimeoutMillis: Int = this.writeTimeoutMillis
  ) = RealInterceptorChain(call, interceptors, index, exchange, request, connectTimeoutMillis, readTimeoutMillis, writeTimeoutMillis)
}
```
这段代码里的 1、2、3 步逻辑，先通过 copy() 根据下一个拦截器创建一个新的责任链，从其中 copy 的入参为 index + 1 可以得出这个结论，此时当前 index 并没有被改变，所以第二步取的是当前的拦截器，然后调用当前拦截器的拦截方法，入参为新的责任链，如果拦截方法可以顺利完成的话，那么会返回 Response，否则会在拦截方法中继续处理责任链（也是 Chain#proceed()）。那排除掉自定义拦截器，自然默认第一个拦截器是 RetryAndFollowUpInterceptor，下面来看看这里面的 intercept() 做了什么。

#### RetryAndFollowUpInterceptor
重试与重定向拦截器。
```
RetryAndFollowUpInterceptor.kt

@Throws(IOException::class)
override fun intercept(chain: Interceptor.Chain): Response {
  val realChain = chain as RealInterceptorChain
  var request = chain.request
  val call = realChain.call
  var followUpCount = 0
  var priorResponse: Response? = null
  var newExchangeFinder = true
  var recoveredFailures = listOf<IOException>()
  while (true) {
    // 进入网络拦截器处理，这个方法在 RealCall 中，目的是创建一个 ExchangeFinder
    call.enterNetworkInterceptorExchange(request, newExchangeFinder)

    var response: Response
    var closeActiveExchange = true
    try {
      if (call.isCanceled()) {
        throw IOException("Canceled")
      }

      try {
        // 执行下一个拦截器，拿到结果后再往下执行
        response = realChain.proceed(request)
        newExchangeFinder = true
      } catch (e: RouteException) {
        // 发生 Route 异常，尝试进行恢复
        // The attempt to connect via a route failed. The request will not have been sent.
        if (!recover(e.lastConnectException, call, request, requestSendStarted = false)) {
          throw e.firstConnectException.withSuppressed(recoveredFailures)
        } else {
          recoveredFailures += e.firstConnectException
        }
        newExchangeFinder = false
        continue
      } catch (e: IOException) {
        // 发生 IO 异常，尝试进行恢复
        // An attempt to communicate with a server failed. The request may have been sent.
        if (!recover(e, call, request, requestSendStarted = e !is ConnectionShutdownException)) {
          throw e.withSuppressed(recoveredFailures)
        } else {
          recoveredFailures += e
        }
        newExchangeFinder = false
        continue
      }

      // 构建 budy 为空的响应体
      // Attach the prior response if it exists. Such responses never have a body.
      if (priorResponse != null) {
        response = response.newBuilder()
            .priorResponse(priorResponse.newBuilder()
                .body(null)
                .build())
              .build()
      }

      // call.interceptorScopedExchange 在数据流结束的时候会返回 null
      val exchange = call.interceptorScopedExchange
      // 检查是否需要重定向，不需要则 followup 为 null
      val followUp = followUpRequest(response, exchange)

      if (followUp == null) {
        if (exchange != null && exchange.isDuplex) {
          call.timeoutEarlyExit()
        }
        closeActiveExchange = false
        // 不需要重定向，并且数据流正常结束了，返回之前的 response
        return response
      }

      val followUpBody = followUp.body
      if (followUpBody != null && followUpBody.isOneShot()) {
        closeActiveExchange = false
        // 最多需要一次 writeTo 且只传输一次，则返回响应体
        return response
      }

      // 关闭资源
      response.body?.closeQuietly()

      // 重定向次数大于最大值，抛出异常
      if (++followUpCount > MAX_FOLLOW_UPS) {
        throw ProtocolException("Too many follow-up requests: $followUpCount")
      }

      // 循环判断
      request = followUp
      priorResponse = response
    } finally {
      // 退出网络拦截器处理
      call.exitNetworkInterceptorExchange(closeActiveExchange)
    }
  }
}

RealCall.kt

/**
 * 创建 ExchangeFinder 实例
 */
fun enterNetworkInterceptorExchange(request: Request, newExchangeFinder: Boolean) {
  check(interceptorScopedExchange == null)

  synchronized(this) {
    check(!responseBodyOpen) {
      "cannot make a new request because the previous response is still open: " +
          "please call response.close()"
    }
    check(!requestBodyOpen)
  }

  if (newExchangeFinder) {
    this.exchangeFinder = ExchangeFinder(
        connectionPool,
        createAddress(request.url),
        this,
        eventListener
    )
  }
}
```
上面的代码中，RetryAndFollowUpInterceptor 这个拦截器首先会去创建 ExchangeFinder 实例，然后往下执行，其实就到了下一个拦截器了，后面的逻辑是在下一个拦截器处理后再进行的，那按照默认拦截器的添加顺序，到 BridgeInterceptor 了，因为在 `realChain.proceed(request)` 这行代码中，调用的依然是 RealInterceptorChain#proceed 的逻辑，拿到下一个拦截器，作为当前拦截器拦截方法的入参，因此直接定位到 BridgeInterceptor#intercept

#### BridgeInterceptor
桥拦截器，应用程序代码到网络代码的桥梁，首先根据用户请求构建网络请求，然后继续调用网络，最后根据网络响应构建用户响应。

```
BridgeInterceptor.kt

@Throws(IOException::class)
override fun intercept(chain: Interceptor.Chain): Response {
  // 这个 request 还是原始的 request
  val userRequest = chain.request()
  val requestBuilder = userRequest.newBuilder()

  // 拼接请求体
  val body = userRequest.body
  if (body != null) {
    val contentType = body.contentType()
    if (contentType != null) {
      requestBuilder.header("Content-Type", contentType.toString())
    }

    val contentLength = body.contentLength()
    if (contentLength != -1L) {
      requestBuilder.header("Content-Length", contentLength.toString())
      requestBuilder.removeHeader("Transfer-Encoding")
    } else {
      requestBuilder.header("Transfer-Encoding", "chunked")
      requestBuilder.removeHeader("Content-Length")
    }
  }

  // 拼接请求头
  if (userRequest.header("Host") == null) {
    requestBuilder.header("Host", userRequest.url.toHostHeader())
  }

  if (userRequest.header("Connection") == null) {
    requestBuilder.header("Connection", "Keep-Alive")
  }

  // If we add an "Accept-Encoding: gzip" header field we're responsible for also decompressing
  // the transfer stream.
  var transparentGzip = false
  if (userRequest.header("Accept-Encoding") == null && userRequest.header("Range") == null) {
    transparentGzip = true
    requestBuilder.header("Accept-Encoding", "gzip")
  }

  val cookies = cookieJar.loadForRequest(userRequest.url)
  if (cookies.isNotEmpty()) {
    requestBuilder.header("Cookie", cookieHeader(cookies))
  }

  if (userRequest.header("User-Agent") == null) {
    requestBuilder.header("User-Agent", userAgent)
  }

  // 这个会进入下一个拦截器，将组装好的请求体作为入参，拿到网络响应后
  val networkResponse = chain.proceed(requestBuilder.build())

  // 处理 cookie 信息（这个扩展里会判断 NO_COOKIES 的话，直接 return，代码就不拷了）
  cookieJar.receiveHeaders(userRequest.url, networkResponse.headers)

  // 处理服务器返回的响应，将其转换为用户可用的响应
  val responseBuilder = networkResponse.newBuilder()
      .request(userRequest)

  if (transparentGzip &&
      "gzip".equals(networkResponse.header("Content-Encoding"), ignoreCase = true) &&
      networkResponse.promisesBody()) {
    val responseBody = networkResponse.body
    if (responseBody != null) {
      val gzipSource = GzipSource(responseBody.source())
      val strippedHeaders = networkResponse.headers.newBuilder()
          .removeAll("Content-Encoding")
          .removeAll("Content-Length")
          .build()
      responseBuilder.headers(strippedHeaders)
      val contentType = networkResponse.header("Content-Type")
      responseBuilder.body(RealResponseBody(contentType, -1L, gzipSource.buffer()))
    }
  }

  return responseBuilder.build()
}
```
BridgeInterceptor 主要的工作就是将开发者传入的网络请求信息进行转换为实际的 HTTP 请求，以及将 HTTP 响应转换为开发者能够使用的信息。老套路，下一个就该 CacheInterceptor 了，直接看看他的 intercept

#### CacheInterceptor
缓存拦截器，处理来自缓存的请求并将响应写入缓存（用到了策略模式）。

```
CacheInterceptor.kt

@Throws(IOException::class)
override fun intercept(chain: Interceptor.Chain): Response {
  // 拿到当前的 RealCall 实例
  val call = chain.call()
  // 这个 cache 是 DiskLruCache（最近最少使用），key 是请求的 url，返回 Response 实例
  val cacheCandidate = cache?.get(chain.request())

  val now = System.currentTimeMillis()

  // 缓存策略，用于判断使用缓存还是使用网络请求，或者都用
  val strategy = CacheStrategy.Factory(now, chain.request(), cacheCandidate).compute()
  val networkRequest = strategy.networkRequest
  val cacheResponse = strategy.cacheResponse

  cache?.trackResponse(strategy)
  val listener = (call as? RealCall)?.eventListener ?: EventListener.NONE

  // 有缓存，但策略中不使用，则释放缓存资源
  if (cacheCandidate != null && cacheResponse == null) {
    // The cache candidate wasn't applicable. Close it.
    cacheCandidate.body?.closeQuietly()
  }

  // 不使用网络请求，也不使用缓存，直接返回失败的响应
  // If we're forbidden from using the network and the cache is insufficient, fail.
  if (networkRequest == null && cacheResponse == null) {
    return Response.Builder()
        .request(chain.request())
        .protocol(Protocol.HTTP_1_1)
        .code(HTTP_GATEWAY_TIMEOUT)
        .message("Unsatisfiable Request (only-if-cached)")
        .body(EMPTY_RESPONSE)
        .sentRequestAtMillis(-1L)
        .receivedResponseAtMillis(System.currentTimeMillis())
        .build().also {
          listener.satisfactionFailure(call, it)
        }
  }

  // 策略中不使用网络请求，则说明用的是缓存，直接返回缓存
  // If we don't need the network, we're done.
  if (networkRequest == null) {
    return cacheResponse!!.newBuilder()
        .cacheResponse(stripBody(cacheResponse))
        .build().also {
          listener.cacheHit(call, it)
        }
  }

  // 回调缓存的监听
  if (cacheResponse != null) {
    listener.cacheConditionalHit(call, cacheResponse)
  } else if (cache != null) {
    listener.cacheMiss(call)
  }

  var networkResponse: Response? = null
  try {
    // 执行下一个拦截器（ConnectInterceptor）进行网络请求，返回网络的响应
    networkResponse = chain.proceed(networkRequest)
  } finally {
    // 如果发生了 IO 或者其它异常，为了不泄漏缓存体，需要释放资源
    // If we're crashing on I/O or otherwise, don't leak the cache body.
    if (networkResponse == null && cacheCandidate != null) {
      cacheCandidate.body?.closeQuietly()
    }
  }

  // 如果策略中使用缓存，并且响应码为 304（无改变，无需传输内容），则返回缓存
  // If we have a cache response too, then we're doing a conditional get.
  if (cacheResponse != null) {
    if (networkResponse?.code == HTTP_NOT_MODIFIED) {
      val response = cacheResponse.newBuilder()
          .headers(combine(cacheResponse.headers, networkResponse.headers))
          .sentRequestAtMillis(networkResponse.sentRequestAtMillis)
          .receivedResponseAtMillis(networkResponse.receivedResponseAtMillis)
          .cacheResponse(stripBody(cacheResponse))
          .networkResponse(stripBody(networkResponse))
          .build()

      networkResponse.body!!.close()

      // Update the cache after combining headers but before stripping the
      // Content-Encoding header (as performed by initContentStream()).
      cache!!.trackConditionalCacheHit()
      // 更新缓存
      cache.update(cacheResponse, response)
      return response.also {
        listener.cacheHit(call, it)
      }
    } else {
      cacheResponse.body?.closeQuietly()
    }
  }

  // 根据网络响应构建响应体
  val response = networkResponse!!.newBuilder()
      .cacheResponse(stripBody(cacheResponse))
      .networkResponse(stripBody(networkResponse))
      .build()

  if (cache != null) {
    if (response.promisesBody() && CacheStrategy.isCacheable(response, networkRequest)) {
      // 将请求返回的结果存进缓存
      // Offer this request to the cache.
      val cacheRequest = cache.put(response)
      return cacheWritingResponse(cacheRequest, response).also {
        if (cacheResponse != null) {
          // This will log a conditional cache miss only.
          listener.cacheMiss(call)
        }
      }
    }

    if (HttpMethod.invalidatesCache(networkRequest.method)) {
      try {
        cache.remove(networkRequest)
      } catch (_: IOException) {
        // The cache cannot be written.
      }
    }
  }

  return response
}
```
CacheInterceptor 实现了缓存的读取和存储，当网络请求的时候执行缓存拦截器的时候，会根据缓存策略去判断是否需要使用缓存、是否使用网络请求数据，如果使用缓存并且有缓存的话会直接返回缓存，没有则会执行后面的拦截器（ConnectInterceptor）继续请求网络，请求成功回将请求到的数据缓存起来。

#### ConnectInterceptor
连接拦截器，打开与目标服务器的连接并继续下一个拦截器，网络可能可用于返回的响应或使用条件 GET 验证缓存的响应。
```
ConnectInterceptor.kt

@Throws(IOException::class)
override fun intercept(chain: Interceptor.Chain): Response {
  val realChain = chain as RealInterceptorChain
  // 调用 RealCall#initExchange，就看看这个方法的逻辑，怎么建立的连接
  val exchange = realChain.call.initExchange(chain)
  val connectedChain = realChain.copy(exchange = exchange)
  // 执行下一个拦截器（不考虑 forWebSocket，是 CallServerInterceptor）
  return connectedChain.proceed(realChain.request)
}

RealCall.kt

internal fun initExchange(chain: RealInterceptorChain): Exchange {
  synchronized(this) {
    check(expectMoreExchanges) { "released" }
    check(!responseBodyOpen)
    check(!requestBodyOpen)
  }

  // 这个取的就是在 RetryAndFollowUpInterceptor 中创建的 ExchangeFinder
  val exchangeFinder = this.exchangeFinder!!
  // 调用 find 方法
  val codec = exchangeFinder.find(client, chain)
  val result = Exchange(this, eventListener, exchangeFinder, codec)
  this.interceptorScopedExchange = result
  this.exchange = result
  synchronized(this) {
    this.requestBodyOpen = true
    this.responseBodyOpen = true
  }

  if (canceled) throw IOException("Canceled")
  return result
}

ExchangeFinder.kt

fun find(
  client: OkHttpClient,
  chain: RealInterceptorChain
): ExchangeCodec {
  try {
    // 调用本身的 findHealthyConnection
    val resultConnection = findHealthyConnection(
        connectTimeout = chain.connectTimeoutMillis,
        readTimeout = chain.readTimeoutMillis,
        writeTimeout = chain.writeTimeoutMillis,
        pingIntervalMillis = client.pingIntervalMillis,
        connectionRetryEnabled = client.retryOnConnectionFailure,
        doExtensiveHealthChecks = chain.request.method != "GET"
    )
    return resultConnection.newCodec(client, chain)
  } catch (e: RouteException) {
    trackFailure(e.lastConnectException)
    throw e
  } catch (e: IOException) {
    trackFailure(e)
    throw RouteException(e)
  }
}

@Throws(IOException::class)
private fun findHealthyConnection(
  connectTimeout: Int,
  readTimeout: Int,
  writeTimeout: Int,
  pingIntervalMillis: Int,
  connectionRetryEnabled: Boolean,
  doExtensiveHealthChecks: Boolean
): RealConnection {
  while (true) {
    // 调用本身的 findConnection
    val candidate = findConnection(
        connectTimeout = connectTimeout,
        readTimeout = readTimeout,
        writeTimeout = writeTimeout,
        pingIntervalMillis = pingIntervalMillis,
        connectionRetryEnabled = connectionRetryEnabled
    )

    // Confirm that the connection is good.
    if (candidate.isHealthy(doExtensiveHealthChecks)) {
      return candidate
    }

    // If it isn't, take it out of the pool.
    candidate.noNewExchanges()

    // Make sure we have some routes left to try. One example where we may exhaust all the routes
    // would happen if we made a new connection and it immediately is detected as unhealthy.
    if (nextRouteToTry != null) continue

    val routesLeft = routeSelection?.hasNext() ?: true
    if (routesLeft) continue

    val routesSelectionLeft = routeSelector?.hasNext() ?: true
    if (routesSelectionLeft) continue

    throw IOException("exhausted all routes")
  }
}

@Throws(IOException::class)
private fun findConnection(
  connectTimeout: Int,
  readTimeout: Int,
  writeTimeout: Int,
  pingIntervalMillis: Int,
  connectionRetryEnabled: Boolean
): RealConnection {
  if (call.isCanceled()) throw IOException("Canceled")

  // 获取 RealCall 里的连接并尝试重用
  // Attempt to reuse the connection from the call.
  val callConnection = call.connection // This may be mutated by releaseConnectionNoEvents()!
  if (callConnection != null) {
    var toClose: Socket? = null
    synchronized(callConnection) {
      if (callConnection.noNewExchanges || !sameHostAndPort(callConnection.route().address.url)) {
        toClose = call.releaseConnectionNoEvents()
      }
    }

    // 连接未被释放，则重用
    // If the call's connection wasn't released, reuse it. We don't call connectionAcquired() here
    // because we already acquired it.
    if (call.connection != null) {
      check(toClose == null)
      return callConnection
    }

    // 连接已被释放则关闭 socket 并回调事件
    // The call's connection was released.
    toClose?.closeQuietly()
    eventListener.connectionReleased(call, callConnection)
  }

  // 创建新的连接需要刷新计数字段
  // We need a new connection. Give it fresh stats.
  refusedStreamCount = 0
  connectionShutdownCount = 0
  otherFailureCount = 0

  // 尝试从连接池（RealConnectionPool）中获取连接
  // 这里会判断连接是否可以被分配传送到指定地址
  // 判断后最终会执行 RealCall#acquireConnectionNoEvents
  // 这个方法判断拿到的 connection 会判断是否持有锁和判空
  // 通过判断最后会赋值到 RealCall#connection 中
  // RealCall 会以弱引用的形式被添加到 RealConnection#calls 中
  // RealConnection 会记录当前连接的请求
  // 此时没有路由
  // Attempt to get a connection from the pool.
  if (connectionPool.callAcquirePooledConnection(address, call, null, false)) {
    val result = call.connection!!
    // 成功后会回调，获取连接成功
    eventListener.connectionAcquired(call, result)
    return result
  }

  // 找合适的路由地址，先判断有没有已标记的，没有就尝试拿到一个新的路由
  // Nothing in the pool. Figure out what route we'll try next.
  val routes: List<Route>?
  val route: Route
  if (nextRouteToTry != null) {
    // Use a route from a preceding coalesced connection.
    routes = null
    route = nextRouteToTry!!
    nextRouteToTry = null
  } else if (routeSelection != null && routeSelection!!.hasNext()) {
    // Use a route from an existing route selection.
    routes = null
    route = routeSelection!!.next()
  } else {
    // Compute a new route selection. This is a blocking operation!
    var localRouteSelector = routeSelector
    if (localRouteSelector == null) {
      localRouteSelector = RouteSelector(address, call.client.routeDatabase, call, eventListener)
      this.routeSelector = localRouteSelector
    }
    val localRouteSelection = localRouteSelector.next()
    routeSelection = localRouteSelection
    routes = localRouteSelection.routes

    if (call.isCanceled()) throw IOException("Canceled")

    // 拿到路由地址列表后，再尝试找连接，如果找到直接返回
    // Now that we have a set of IP addresses, make another attempt at getting a connection from
    // the pool. We have a better chance of matching thanks to connection coalescing.
    if (connectionPool.callAcquirePooledConnection(address, call, routes, false)) {
      val result = call.connection!!
      eventListener.connectionAcquired(call, result)
      return result
    }

    route = localRouteSelection.next()
  }

  // 找不到连接，则会根据路由新建一个 RealConnection
  // Connect. Tell the call about the connecting call so async cancels work.
  val newConnection = RealConnection(connectionPool, route)
  call.connectionToCancel = newConnection
  try {
    // 执行连接，是 RealConnection#connect
    newConnection.connect(
        connectTimeout,
        readTimeout,
        writeTimeout,
        pingIntervalMillis,
        connectionRetryEnabled,
        call,
        eventListener
    )
  } finally {
    call.connectionToCancel = null
  }
  // 记录路由
  call.client.routeDatabase.connected(newConnection.route())

  // If we raced another call connecting to this host, coalesce the connections. This makes for 3
  // different lookups in the connection pool!
  if (connectionPool.callAcquirePooledConnection(address, call, routes, true)) {
    val result = call.connection!!
    nextRouteToTry = route
    newConnection.socket().closeQuietly()
    eventListener.connectionAcquired(call, result)
    return result
  }

  synchronized(newConnection) {
    connectionPool.put(newConnection)
    call.acquireConnectionNoEvents(newConnection)
  }

  eventListener.connectionAcquired(call, newConnection)
  return newConnection
}

RealConnection.kt

fun connect(
  connectTimeout: Int,
  readTimeout: Int,
  writeTimeout: Int,
  pingIntervalMillis: Int,
  connectionRetryEnabled: Boolean,
  call: Call,
  eventListener: EventListener
) {
  check(protocol == null) { "already connected" }

  var routeException: RouteException? = null
  val connectionSpecs = route.address.connectionSpecs
  val connectionSpecSelector = ConnectionSpecSelector(connectionSpecs)

  // HTTP 的请求判断
  if (route.address.sslSocketFactory == null) {
    if (ConnectionSpec.CLEARTEXT !in connectionSpecs) {
      throw RouteException(UnknownServiceException(
          "CLEARTEXT communication not enabled for client"))
    }
    val host = route.address.url.host
    if (!Platform.get().isCleartextTrafficPermitted(host)) {
      throw RouteException(UnknownServiceException(
          "CLEARTEXT communication to $host not permitted by network security policy"))
    }
  } else {
    if (Protocol.H2_PRIOR_KNOWLEDGE in route.address.protocols) {
      throw RouteException(UnknownServiceException(
          "H2_PRIOR_KNOWLEDGE cannot be used with HTTPS"))
    }
  }

  while (true) {
    try {
      if (route.requiresTunnel()) {
        // 返回通过 HTTP 代理创建 TLS 隧道的请求（未加密地发送到代理服务器）
        // 默认使用 HTTP_1_1 
        // 先通过建立连接通道（Proxy-Connection: Keep-Alive），保持长连接
        // 调用链: createTunnelRequest -> connectSocket -> Platform.get().connectSocket -> socket.connect() -> SocketImpl.connect()
        // 最终是通过 Socket 进行连接，具体代码就不拷贝了，可以自行看看
        connectTunnel(connectTimeout, readTimeout, writeTimeout, call, eventListener)
        if (rawSocket == null) {
          // We were unable to connect the tunnel but properly closed down our resources.
          break
        }
      } else {
        // 直接连接 socket 处理 HTTP 的请求连接
        connectSocket(connectTimeout, readTimeout, call, eventListener)
      }
      // 建立协议
      // 会先判断 sslSocketFactory 是否为空，为空的话就是普通的 HTTP 请求
      // 再判断 HTTP 版本号
      // 是否使用的是 HTTP_2 协议如果是会通过 startHttp2 执行请求
      // 否则默认还是使用 HTTP_1_1 协议
      // 最终通过 connectTls 建立 TLS 连接
      establishProtocol(connectionSpecSelector, pingIntervalMillis, call, eventListener)
      // 回调连接结束
      eventListener.connectEnd(call, route.socketAddress, route.proxy, protocol)
      break
    } catch (e: IOException) {
      socket?.closeQuietly()
      rawSocket?.closeQuietly()
      socket = null
      rawSocket = null
      source = null
      sink = null
      handshake = null
      protocol = null
      http2Connection = null
      allocationLimit = 1

      // 回调连接失败
      eventListener.connectFailed(call, route.socketAddress, route.proxy, null, e)

      // 异常分发
      if (routeException == null) {
        routeException = RouteException(e)
      } else {
        routeException.addConnectException(e)
      }

      if (!connectionRetryEnabled || !connectionSpecSelector.connectionFailed(e)) {
        throw routeException
      }
    }
  }

  if (route.requiresTunnel() && rawSocket == null) {
    throw RouteException(ProtocolException(
        "Too many tunnel connections attempted: $MAX_TUNNEL_ATTEMPTS"))
  }

  idleAtNs = System.nanoTime()
}

@Throws(IOException::class)
private fun connectTls(connectionSpecSelector: ConnectionSpecSelector) {
  val address = route.address
  val sslSocketFactory = address.sslSocketFactory
  var success = false
  var sslSocket: SSLSocket? = null
  try {
    // 在原始 socket（前面创建的）上通过 sslSocketFactory 包一层
    // Create the wrapper over the connected socket.
    sslSocket = sslSocketFactory!!.createSocket(
        rawSocket, address.url.host, address.url.port, true /* autoClose */) as SSLSocket

    // 配置 socket 密码、TLS 版本和扩展
    // Configure the socket's ciphers, TLS versions, and extensions.
    val connectionSpec = connectionSpecSelector.configureSecureSocket(sslSocket)
    if (connectionSpec.supportsTlsExtensions) {
      Platform.get().configureTlsExtensions(sslSocket, address.url.host, address.protocols)
    }

    // 开始握手
    // Force handshake. This can throw!
    sslSocket.startHandshake()
    // block for session establishment
    val sslSocketSession = sslSocket.session
    val unverifiedHandshake = sslSocketSession.handshake()

    // 验证目标主机是否可以接受套接字的证书
    // Verify that the socket's certificates are acceptable for the target host.
    if (!address.hostnameVerifier!!.verify(address.url.host, sslSocketSession)) {
      val peerCertificates = unverifiedHandshake.peerCertificates
      if (peerCertificates.isNotEmpty()) {
        val cert = peerCertificates[0] as X509Certificate
        throw SSLPeerUnverifiedException("""
            |Hostname ${address.url.host} not verified:
            |    certificate: ${CertificatePinner.pin(cert)}
            |    DN: ${cert.subjectDN.name}
            |    subjectAltNames: ${OkHostnameVerifier.allSubjectAltNames(cert)}
            """.trimMargin())
      } else {
        throw SSLPeerUnverifiedException(
            "Hostname ${address.url.host} not verified (no certificates)")
      }
    }

    // 返回地址的证书 pinner，如果不是 HTTPS 地址，则返回 null
    val certificatePinner = address.certificatePinner!!

    // 根据未验证的 TLS 握手记录新建一个 TLS 握手记录
    handshake = Handshake(unverifiedHandshake.tlsVersion, unverifiedHandshake.cipherSuite,
        unverifiedHandshake.localCertificates) {
      certificatePinner.certificateChainCleaner!!.clean(unverifiedHandshake.peerCertificates,
          address.url.host)
    }

    // 检查证书
    // Check that the certificate pinner is satisfied by the certificates presented.
    certificatePinner.check(address.url.host) {
      handshake!!.peerCertificates.map { it as X509Certificate }
    }

    // 成功，根据平台选择对应的应用层协议
    // Success! Save the handshake and the ALPN protocol.
    val maybeProtocol = if (connectionSpec.supportsTlsExtensions) {
      Platform.get().getSelectedProtocol(sslSocket)
    } else {
      null
    }
    socket = sslSocket
    source = sslSocket.source().buffer()
    sink = sslSocket.sink().buffer()
    // 找不到默认就是 HTTP1.1
    protocol = if (maybeProtocol != null) Protocol.get(maybeProtocol) else Protocol.HTTP_1_1
    success = true
  } finally {
    // 释放资源
    if (sslSocket != null) {
      Platform.get().afterHandshake(sslSocket)
    }
    if (!success) {
      sslSocket?.closeQuietly()
    }
  }
}
```
ConnectInterceptor 主要工作是判断当前连接是否可用，可用就直接返回，不可用就会从连接池中获取可用连接，如果找不到就切换不同的路由再次从连接池中获取可用的连接，如果还是没找到的话，就重新创建一个新的连接，进行 TLS 和 TCP 握手，最终将新创建的连接放入连接池中。<br/>
在连接创建之前，OkHttp 还会判断 HTTP 连接是否需要隧道连接，如果需要的话就添加相应的属性 `RealConnection#createTunnelRequest`，不需要则直接进行 socket 连接。<br/>
在建立协议的过程中，会判断是否为 HTTPS 的连接，不是则正常连接，是会先包一层 TLS，再进行连接。<br/>
最后就还有一个 CallServerInterceptor，请求服务器拦截器。

#### CallServerInterceptor
访问服务器拦截器，对服务器进行网络调用，是链中最后一个拦截器。

```
CallServerInterceptor.kt

@Throws(IOException::class)
override fun intercept(chain: Interceptor.Chain): Response {
  val realChain = chain as RealInterceptorChain
  // exchange 中 HTTP1.1 codec 对应 Http1ExchangeCodec
  // HTTP2 codec 对应 Http2ExchangeCodec
  // 封装的是创建、写入、刷新等方法
  val exchange = realChain.exchange!!
  val request = realChain.request
  val requestBody = request.body
  val sentRequestMillis = System.currentTimeMillis()

  var invokeStartEvent = true
  var responseBuilder: Response.Builder? = null
  var sendRequestException: IOException? = null
  try {
    // 写入请求头
    exchange.writeRequestHeaders(request)

    // 有请求体则写入（主要是写入和刷新逻辑），否则按没有请求体进行请求
    if (HttpMethod.permitsRequestBody(request.method) && requestBody != null) {
      // If there's a "Expect: 100-continue" header on the request, wait for a "HTTP/1.1 100
      // Continue" response before transmitting the request body. If we don't get that, return
      // what we did get (such as a 4xx response) without ever transmitting the request body.
      if ("100-continue".equals(request.header("Expect"), ignoreCase = true)) {
        exchange.flushRequest()
        responseBuilder = exchange.readResponseHeaders(expectContinue = true)
        exchange.responseHeadersStart()
        invokeStartEvent = false
      }
      if (responseBuilder == null) {
        if (requestBody.isDuplex()) {
          // Prepare a duplex body so that the application can send a request body later.
          exchange.flushRequest()
          val bufferedRequestBody = exchange.createRequestBody(request, true).buffer()
          requestBody.writeTo(bufferedRequestBody)
        } else {
          // Write the request body if the "Expect: 100-continue" expectation was met.
          val bufferedRequestBody = exchange.createRequestBody(request, false).buffer()
          requestBody.writeTo(bufferedRequestBody)
          bufferedRequestBody.close()
        }
      } else {
        exchange.noRequestBody()
        if (!exchange.connection.isMultiplexed) {
          // If the "Expect: 100-continue" expectation wasn't met, prevent the HTTP/1 connection
          // from being reused. Otherwise we're still obligated to transmit the request body to
          // leave the connection in a consistent state.
          exchange.noNewExchangesOnConnection()
        }
      }
    } else {
      exchange.noRequestBody()
    }

    // 如果没有请求体，那就请求刷新到底层 socket 并发出不再传输字节的信号
    if (requestBody == null || !requestBody.isDuplex()) {
      exchange.finishRequest()
    }
  } catch (e: IOException) {
    // 处理 IO 异常
    if (e is ConnectionShutdownException) {
      throw e // No request was sent so there's no response to read.
    }
    if (!exchange.hasFailure) {
      throw e // Don't attempt to read the response; we failed to send the request.
    }
    sendRequestException = e
  }

  try {
    // 处理响应
    if (responseBuilder == null) {
      // 解析来自 HTTP 传输的响应头的字节并返回 Response.Builder
      responseBuilder = exchange.readResponseHeaders(expectContinue = false)!!
      if (invokeStartEvent) {
        exchange.responseHeadersStart()
        invokeStartEvent = false
      }
    }
    // 拿到响应信息，记录 HTTP 响应码
    var response = responseBuilder
        .request(request)
        .handshake(exchange.connection.handshake())
        .sentRequestAtMillis(sentRequestMillis)
        .receivedResponseAtMillis(System.currentTimeMillis())
        .build()
    var code = response.code
    if (code == 100) {
      // 如果收到 100（继续完成请求的话）就再解析一次
      // Server sent a 100-continue even though we did not request one. Try again to read the
      // actual response status.
      responseBuilder = exchange.readResponseHeaders(expectContinue = false)!!
      if (invokeStartEvent) {
        exchange.responseHeadersStart()
      }
      response = responseBuilder
          .request(request)
          .handshake(exchange.connection.handshake())
          .sentRequestAtMillis(sentRequestMillis)
          .receivedResponseAtMillis(System.currentTimeMillis())
          .build()
      code = response.code
    }

    // 解析头部信息结束
    exchange.responseHeadersEnd(response)

    // 获取响应体
    response = if (forWebSocket && code == 101) {
      // Connection is upgrading, but we need to ensure interceptors see a non-null response body.
      response.newBuilder()
          .body(EMPTY_RESPONSE)
          .build()
    } else {
      response.newBuilder()
          .body(exchange.openResponseBody(response))
          .build()
    }
    // 根据响应码做对应的处理
    if ("close".equals(response.request.header("Connection"), ignoreCase = true) ||
        "close".equals(response.header("Connection"), ignoreCase = true)) {
      exchange.noNewExchangesOnConnection()
    }
    if ((code == 204 || code == 205) && response.body?.contentLength() ?: -1L > 0L) {
      throw ProtocolException(
          "HTTP $code had non-zero Content-Length: ${response.body?.contentLength()}")
    }
    // 没问题就返回
    return response
  } catch (e: IOException) {
    // IO 异常处理
    if (sendRequestException != null) {
      sendRequestException.addSuppressed(e)
      throw sendRequestException
    }
    throw e
  }
}
```
这里有提到的 Http1ExchangeCodec 和 Http2ExchangeCodec 都是用于流读写的，根据 HTTP 版本的不同进行区分使用，BufferedSink（输出流）和 BufferedSource（输入流）是由 okio 提供的工具，在这里主要用于写入请求头和请求体，读取响应头和响应体。<br/>
看完这部分的代码，可以知道 CallServerInterceptor 主要是给服务器发起请求并获取数据的，也是在默认的拦截器中最后一个拦截器，获取到服务器数据后，会直接返回给上一个拦截器。责任链最终还是会回到 RetryAndFollowupInterceptor 中返回，而 getResponseWithInterceptorChain 这个方法就能拿到 response，再在同步方法中返回这个 response，整个同步方法的调用链就完成了。

## 源码篇小结

### API 总结
OkHttpClient: Call 的工厂，可用于发送 HTTP 请求并获取其响应<br/>
Request: HTTP 请求<br/>
RealCall: OkHttp 的应用层和网络层之间的桥梁（包含高级应用层的连接、请求、响应和流）<br/>
RealCall.AsyncCall: 是个 Runnable，用于处理异步请求<br/>
Dispatcher: 用于执行请求的策略<br/>
RealInterceptorChain: 具体的拦截器链，承载整个拦截器链，最后是网络调用者（用于应用程序拦截器，exchange 必须为空，用于网络拦截器，exchange 必须为非空）<br/>
RetryAndFollowUpInterceptor: 重试与重定向拦截器<br/>
ExchangeFinder: 尝试查找交换的连接以及随后的任何重试策略（主要用于建立连接）<br/>
BridgeInterceptor: 桥拦截器，应用程序代码到网络代码的桥梁，首先根据用户请求构建网络请求，然后继续调用网络，最后根据网络响应构建用户响应<br/>
CacheInterceptor: 缓存拦截器，处理来自缓存的请求并将响应写入缓存<br/>
ConnectInterceptor: 连接拦截器，打开与目标服务器的连接并继续下一个拦截器，网络可能可用于返回的响应或使用条件 GET 验证缓存的响应<br/>
RealConnection: 与远程 web 服务器的连接，能够承载 1 个或多个并发流。连接的生命周期有两个阶段。<br/>
&emsp;&emsp;1、在连接时，连接由使用单线程的单个调用拥有，这个阶段，连接不是共享的，也不需要锁定<br/>
&emsp;&emsp;2、连接后，连接共享到连接池，此阶段，必须通过在连接上持有锁来保护对连接状态的访问<br/>
RealConnectionPool: 连接池，维护连接队列（ConcurrentLinkedQueue）和清理队列（TaskQueue）<br/>
CallServerInterceptor: 访问服务器拦截器，对服务器进行网络调用，是链中最后一个拦截器<br/>
Http1ExchangeCodec: 用于发送 HTTP/1.1 消息的套接字连接。严格执行以下生命周期。<br/>
&emsp;&emsp;1、发送请求头（writeRequest）<br/>
&emsp;&emsp;2、打开一个接收器来写入请求体 （newKnownLengthSink 或 newChunkedSink）<br/>
&emsp;&emsp;3、写入然后关闭该接收器<br/>
&emsp;&emsp;4、读取响应头（readResponseHeaders）<br/>
&emsp;&emsp;5、打开源已读取响应正文（newFixedLengthSource 或 newChunkedSource 或 newUnknownLengthSource）<br/>
&emsp;&emsp;6、读取并关闭该资源<br/>
&emsp;没有请求正文的会跳过创建和关闭请求征文<br/>
&emsp;没有响应正文的可以调用 newFixedLengthSource(0) 且可以跳过读取和关闭该源<br/>
Http2ExchangeCodec: 使用 HTTP/2 帧编码请求和响应

### 调用流程
同步调用<br/>
1、通过构造 OkHttpClient 和 Request 构造出 RealCall 实例<br/>
2、通过 RealCall#execute() 开始进行同步调用<br/>
3、通过 Dispatcher#executed() 将调用存放到同步调用队列（runningSyncCalls，实际是 ArrayQueue）中
3、通过 RealCall#getResponseWithInterceptorChain 开始进入责任链进行网络请求<br/>

异步调用<br/>
1、通过构造 OkHttpClient 和 Request 构造出 RealCall 实例<br/>
2、通过 RealCall#enqueue() 开始进行异步调用<br/>
3、通过 responseCallback（Callback）实例化 AsyncCall 并将他传入 Dispatcher#enqueue()  <br/>
4、通过 Dispatcher#promoteAndExecute() 遍历集合中的 AsyncCall，并以此执行 AsyncCall#executeOn()，并把创建的线程池作为参数传递进去<br/>
5、调用线程池的 execute()，执行 AsyncCall#run() <br/>
6、在 AsyncCall#run() 中通过 RealCall#getResponseWithInterceptorChain() 开始进入责任链进行网络请求，并通过 responseCallback 进行回调，请求正常回调 onResponse()，出现异常回调 onFailure() <br/>

### 问题
1、OkHttp 实现网络请求的方式<br/>
OkHttp 实际上是通过 Socket 进行网络连接的，会根据配置先判断是否需要开启代理隧道（目的是利用 HTTP 来代理请求 HTTPS），需要则开启（connectTunnel）否则会直接建立 TCP 连接（connectSocket）。无论是否需要开启隧道，都会建立一个 TCP 连接（都会调用 connectSocket）。最后会调用 Platform.get().connectSocket()（Socket#connect()）打开一个 TCP 连接<br/>

2、为什么 response.body().string() 只能调用一次<br/>
通过 source 拿到字节流后，会调用 closeQuietly() 执行关闭，所以只能用一次，可以缓存一份或者自定义拦截器处理 log<br/>

3、OkHttp 运用的设计模式
构造者模式（OkHttpClient、Request 对象的创建）<br/>
工厂模式（获取 Call 接口的实例）<br/>
单例模式（Platform 类型）<br/>
策略模式（CacheInterceptor，在响应数据的选择中使用了策略模式，用缓存数据还是网络数据）<br/>
责任链模式（拦截器的链式调用）<br/>
享元模式（共享技术，支持复用）（Dispatcher 的线程池中，不限量的线程池实现了对象复用）<br/>

4、Dispatcher 在异步请求中为什么要分两个 ArrayDeque（runningAsyncCalls 和 readyAsyncCalls）
runningAsyncCalls 用于保存正在执行的请求，readyAsyncCalls 用于保存准备执行的请求，因为 Dispatcher 默认支持最大的并发请求（maxRequests）是 64 个，单个 Host（maxRequestsPerHost）最多执行 5 个并发请求，如果超了，那 Call 会先被放入 readyAsyncCalls 中，当出现空闲的线程时，再将 readyAsyncCalls 中的线程移到 runningAsyncCalls 中执行请求，具体逻辑在（Dispatcher#promoteAndExecute()）中，只要满足正在请求的数量 < 64 && 同一域名正在请求的数量 < 5 就会加入 runningAsyncCalls 中，否则会放到 readAsyncCalls 中。

## 思考
本来想着是希望通过 OkHttp 的代码来了解一下网络的分层，但是这个库主要还是集中在应用层的逻辑处理，需要注意的是 BridgeInterceptor 这个拦截器，我认为是数据逻辑上的桥（并不属于网络的分层结构中的桥）。但也意识到就算是应用层的开发，里面涉及到的知识点也是很多的（就像建立代理隧道来代理请求 HTTPS 这样的操作很强）。还有在 HTTPS 中握手的抽象 HandShake（也是用于描述完成的握手）、异步调用中为了提高复用的线程池（ThreadPoolExecutor 的使用）等等用法很值得学习。<br/>
最后说明一下，因为是了解 OkHttp 的主流程，里面有很多细节的地方并没有详细了解，比如 RealConnection 和 RealConnectionPool 他俩的细节就没大看懂..... 如果文中有错误的理解希望读者可以指正，大家一起进步～

## 参考资料
- [官方文档](https://square.github.io/okhttp/)
- [OkHttp的源码解析（一）](https://github.com/jhbxyz/ArticleRecord/blob/master/articles/%E4%BC%98%E7%A7%80%E5%BC%80%E6%BA%90%E5%BA%93/2OkHttp%E7%9A%84%E6%BA%90%E7%A0%81%E8%A7%A3%E6%9E%90%EF%BC%88%E4%B8%80%EF%BC%89.md)
- [OkHttp的源码解析（二）](https://github.com/jhbxyz/ArticleRecord/blob/master/articles/%E4%BC%98%E7%A7%80%E5%BC%80%E6%BA%90%E5%BA%93/3OkHttp%E7%9A%84%E6%BA%90%E7%A0%81%E8%A7%A3%E6%9E%90%EF%BC%88%E4%BA%8C%EF%BC%89.md)
- [Android 主流开源框架（三）OkHttp 源码解析](https://www.jianshu.com/p/bca742ffdbf6)
- [老生新谈，从OkHttp原理看网络请求](https://juejin.cn/post/6979729429228421134#heading-12)