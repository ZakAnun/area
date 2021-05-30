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

**同步和异步**













