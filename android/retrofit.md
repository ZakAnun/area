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
在开发的过程中，客户端经常需要进行网络通信，以达到与服务端的数据交互。本篇从 Retrofit 这个库开始了解网络通信的基本流程。官方文档中对 Retrofit 的介绍: `turns your HTTP API into a Java interface.` 意思是将 HTTP 的 API 转换为 Java 接口。那在实际使用中我们就可以通过这个转换后的 Java 接口进行网络请求了。

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
**URL 声明**
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
Call<List<User>> groupList(@Path("id") int groupId, @Query("sort") String sort);

/**
 * @QueryMap 以 map 的形式声明参数，参数多的时候更方便
 */
Call<List<User>> groupList(@Path("id") int groupId, @QueryMap Map<String, String> options);
```
**请求体**
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
**表单编码和分部请求**
Content-Type 编码方式
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
**请求头声明**
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
**同步和异步**
Call 实例可以被同步执行和异步执行，每个 Call 示例只会被使用一次，但使用 clone() 将创建一个新的能够被使用的示例
在 Android 中，网络回调将会在主线程被执行。在 JVM 中，回调将会在同一个线程中被执行

### Retrofit 配置
Retrofit 是将 API 接口转换为可调用对象的类。默认情况下，Retrofit 将为使用的平台提供合理的默认配置，同时支持自定义。
默认情况下，Retrofit 只能将 HTTP 响应体反序列化为 OkHttp 的 ResponseBody 类型，并且只能接收 @Body 的 RequestBody 类型。
但添加 Converters 可以支持其它的类型，提供以下转换器（Gson、Jackson、Moshi、Protoful、Wire、Simple XML、JAXB、Scalars）
```
// 示例代码

Retrofit retrofit = new Retrofit.Builder()
		.baseUrl("https://api.github.com/")
		.addConverterFactory(GsonConverterFactory.create())
		.build();
		
GitHubService service = retrofit.create(GitHubService.class);
```
此外，可以继承 Converter.Factory 这个类来自定义转换器来适配开发者的需求


















