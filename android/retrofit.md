---
title: Retrofit 篇
description: android network
image: https://picsum.photos/536/354?random&date=2021-05-30
date: 2021-05-30
vssue-title: android network
tags:
  - knowledge
categories:
  - android
---

### 概述
在开发的过程中，客户端经常需要进行网络通信，以达到与服务端的数据交互。本篇从 Retrofit 这个库开始了解网络通信的基本流程。官方文档中对 Retrofit 的介绍: `turns your HTTP API into a Java interface.` 意思是将 HTTP 的 API 转换为 Java 接口。那在实际使用中我们就可以通过这个转换后的 Java 接口进行网络请求了。首先来简单阅读以下文档（了解一个库最便捷的方式），基本篇

### 基本用法

先贴一下官方文档上面的 demo
```
/**
 * 由开发者自己定义的接口
 */
public interface GitHubService {
	@GET("users/{user}/repos")
	Call<List<Repo>> listRepos(@Path("user") String user);
}

/**
 * Retrofit 会帮助我们生成 GitHubService 的实现类
 * 开发者拿到 GitHubService 的引用后进行方法的调用
 */
Retrofit retrofit = new Retrofit.Builder()
    .baseUrl("https://api.github.com/")
    .build();
GitHubService service = retrofit.create(GitHubService.class);

/**
 * 可以通过同步或者异步的方式拿到调用方法后的结果
 * 这个结果就是通过 HTTP 请求服务端拿到的响应
 */
Call<List<Repo>> repos = service.listRepos("octocat");
```
从上面的 demo 中可以初步了解到 Retrofit 的基本使用，它将 HTTP 请求转换成我们常用的接口，通过注解声明的方法声明 HTTP 请求，它支持
- URL 参数替换和支持查询参数
- 可以将对象转换成请求体（如: JSON，协议缓冲）
- 多部分请求体和文件上传

### 基础 API
**URL 声明**<br/>
url 声明可以动态更新可以被替换的部分，在注解中可以被替换的部分需要被 { 和 } 包裹，替换的值需要使用 @Path 进行声明，同时也支持添加请求参数

```
// 示例代码（接口中的代码）

/**
 * @Path 声明的参数可以替换 {id} 再配合 baseUrl 形成最终的请求 url
 */
@GET("group/{id}/users")
Call<List<User>> groupList(@Path("id") int groupId);

/**
 * @Query 声明的参数在 GET 方法中会被添加在最终请求的 url 后
 * 形成请求链接 requestUrl?sort=desc 进行请求
 */
@GET("group/{id}/users")
Call<List<User>> groupList(@Path("id") int groupId, @Query("sort") String sort);

/**
 * @QueryMap 以 map 的形式声明参数，参数多的时候更方便
 */
@GET("group/{id}/users")
Call<List<User>> groupList(@Path("id") int groupId, @QueryMap Map<String, String> options);
```
**请求体**<br/>
通过 @Body 可以将一个对象指定为 HTTP 的请求体
```
// 示例代码

/**
 * @Body 修饰的对象会由 Retrofit 指定的转换器进行转换
 * 如果没有转换器则会使用 RequestBody
 */
@POST("users/new")
Call<User> createUser(@Body User user);
```
**表单编码和分部请求**<br/>
Content-Type 编码方式<br/>
- form-encoded（application/x-www-form-urlencoded） 使用 @FormUrlEncoded 表示，键值对使用 @Field 声明
- multipart（multipart/form-data）使用 @Multipart 表示，分部使用 @Part 声明，Retrofit 有默认的转换器将这种方式转换，此外也可以实现 RequestBody 自行处理序列化
```
// 示例代码

@FormUrlEncoded
@POST("user/edit")
Call<User> updateUser(@Field("first_name") String first, @Field("last_name") String last);

@Multipart
@PUT("user/photo")
Call<User> updateUser(@Part("photo") RequestBody photo, @Part("description") RequestBody description);
```
**请求头声明**<br/>
开发者可以使用 @Headers 来设置头部信息，头部信息不回被重写，所有头部信息都会包含在请求头中。同样的，请求头也可以使用 @Header 来动态添加，如果 @Header 传入的值为 null 的时候，那他就会被省略，如果不想被省略可以使用 toString 避免传入 null
```
// 示例代码

@Headers("Cache-Control: max-age=640000")
@GET("widget/list")
Call<List<Widget>> widgetList();

@Headers({
  "Accept: application/vnd.github.v3.full+json",
	"User-Agent: Retrofit-Sample-App"
})
@GET("users/{username}")
Call<User> getUser(@Path("username") String username);

@GET("user")
Call<User> getUser(@Header("Authorization" String authorization))

@GET("users")
Call<User> getUser(@HeaderMap Map<String, String> headers)
```
**同步和异步**<br/>
Call 实例可以被同步执行和异步执行，每个 Call 示例只会被使用一次，但使用 clone() 将创建一个新的能够被使用的示例
在 Android 中，网络回调将会在主线程被执行。在 JVM 中，回调将会在同一个线程中被执行

### Retrofit 配置
Retrofit 是将 API 接口转换为可调用对象的类。默认情况下，Retrofit 将为使用的平台提供合理的默认配置，同时支持自定义。
默认情况下，Retrofit 只能将 HTTP 响应体反序列化为 OkHttp 的 ResponseBody 类型，并且只能接收 @Body 的 RequestBody 类型。
但添加 Converters 可以支持其它的类型，提供以下转换器（Gson、Jackson、Moshi、Protoful、Wire、Simple XML、JAXB、Scalars）
```
// 示例代码

// 配置
Retrofit retrofit = new Retrofit.Builder()
		.baseUrl("https://api.github.com/")
		.addConverterFactory(GsonConverterFactory.create())
		.build();
		
// 创建与使用
GitHubService service = retrofit.create(GitHubService.class);
service.listRepos("zak");
```
此外，可以继承 Converter.Factory 这个类来自定义转换器来适配开发者的需求

### 基础篇小结
以上内容，就是 Retrofit 文档里告诉开发者的一些基本用法，这个库目前也是我最常使用的网络请求库了，那必须是简单了解一下它是怎么实现将 HTTP 请求封装成开发者所熟悉使用的接口？又是怎样开启网络请求？带着这俩疑问准备开始源码篇

### 源码篇
**基本方式**<br/>
源码的阅读，一般先从调用入口开始追踪，逐步捋清调用链，如果从调用入口的方法中获取到的信息比较少，那就从构造的方法开始着手。总之创建、配置、调用，基本上就是这些（有些细节实现的地方，了解阶段应该跳过，不要阻塞对整个的了解~）。
先看 Retrofit 的配置，通过构造 Builder 传入所需的参数，那这个就先跳过。再看使用，通过 Retrofit 的实例，调用 create(*.class) 并传入接口的 class 对象（Class 对象用于记录类的成员、接口等信息），从 create 开始逐步了解
```
public <T> T create(final Class<T> service) {
		/**
		 * 验证传入的类对象（类的类对象）是否为接口、以及是否是需要提前验证并加载该类的方法
		 * 这里说得比较绕，简单点说是，由于 Retrofit 是通过接口进行使用的
		 * 1、在使用之前需要判断一下传入的 Class 对象是否为接口，不是则抛出异常
		 * 2、另外还会判断传入的接口是否包含范型，如果包含则抛出异常
		 * 3、如果接口中还包含接口，还是对内层接口进行判断（套多少都给判断了）
		 * 4、如果在配置 Retrofit 时，指定提前验证，则会把接口方法的合法性也会判断了
		 * 
		 * 具体代码，可以去源码中查看
		 */
    validateServiceInterface(service);
    /**
     * 通过前面的验证，返回一个代理实例（就是动态代理）
     * 在运行期，生成接口实现类并调用 InvocationHandler#invoke()
     */
    return (T)
        Proxy.newProxyInstance(
            service.getClassLoader(),
            new Class<?>[] {service},
            new InvocationHandler() {
            	// 判断调用平台信息
              private final Platform platform = Platform.get();
              private final Object[] emptyArgs = new Object[0];

              @Override
              public @Nullable Object invoke(Object proxy, Method method, @Nullable Object[] args)
                  throws Throwable {
                // If the method is a method from Object then defer to normal invocation.
                // 刚好有英文解释，直译就是如果是 Object 的方法默认调用它的实现
                if (method.getDeclaringClass() == Object.class) {
                  return method.invoke(this, args);
                }
                args = args != null ? args : emptyArgs;
                /**
                 * 三元表达式
                 * 如果是 java8 并带有 default 关键字修饰的方法，按照 default 的方法执行
                 * 否则调用 loadServiceMethod 方法，通过该方法返回的实例调用 invoke 并传入参数
                 */
                return platform.isDefaultMethod(method)
                    ? platform.invokeDefaultMethod(method, service, proxy, args)
                    : loadServiceMethod(method).invoke(args);
              }
            });
  }

/**
 * serviceMethodCache 是一个 ConcurrentHashMap，记录 method 对应的 ServiceMethod
 * 1、根据传入的 method 从缓存中获取，有则返回
 * 2、上锁并通过 ServiceMethod.parseAnnotations() 创建示例后存到缓存中
 * 所以需要看看 SerivceMethod 是什么
 */
ServiceMethod<?> loadServiceMethod(Method method) {
    ServiceMethod<?> result = serviceMethodCache.get(method);
    if (result != null) return result;

    synchronized (serviceMethodCache) {
      result = serviceMethodCache.get(method);
      if (result == null) {
        result = ServiceMethod.parseAnnotations(this, method);
        serviceMethodCache.put(method, result);
      }
    }
    return result;
  }
```
到这里，追踪到的是通过 Retrofit#create 可以拿到接口的代理对象，当这个代理对象的方法被执行后，就是执行的 ServiceMethod#invode 并返回接口方法中的范型。那再看 ServiceMethod
```

```
















