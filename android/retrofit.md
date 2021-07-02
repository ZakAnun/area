---
title: Retrofit 篇
display: home
description: android retrofit
image: https://picsum.photos/536/354?random&date=2021-05-30
date: 2021-05-30
vssue-title: android retrofit
tags:
  - knowledge
categories:
  - android
---

## 大纲

[掘金](https://juejin.cn/post/6978445924016226318)
[CSDN](https://blog.csdn.net/Lin_For_Game/article/details/118279243?spm=1001.2014.3001.5502)

* [概述](#概述)
* [基本用法](#基本用法)
* [配置](#配置)
* [基础篇小结](#基础篇小结)
* [源码篇](#源码篇)
* [源码篇小结](#源码篇小结)
* [思考](#思考)
* [参考资料](#参考资料)

## 概述

在开发的过程中，客户端经常需要进行网络通信，以达到与服务端的数据交互。本篇从 Retrofit 这个库开始了解网络通信的基本流程。官方文档中对 Retrofit 的介绍: `turns your HTTP API into a Java interface.` 意思是将 HTTP 的 API 转换为 Java 接口。那在实际使用中我们就可以通过这个转换后的 Java 接口进行网络请求了。<br/>
另外阅读 Retrofit 需要一点前置知识点就是[动态代理](https://github.com/ZakAnun/java-basic/blob/master/src/proxydemo/Main.java)和[注解](https://github.com/ZakAnun/java-basic/blob/master/src/enumdemo/Operator.java)（文章在[参考资料](#参考资料)）

## 基本用法

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
开发者可以使用 @Headers 来设置头部信息，头部信息不会被重写，所有头部信息都会包含在请求头中。同样的，请求头也可以使用 @Header 来动态添加，如果 @Header 传入的值为 null 的时候，那他就会被省略，如果不想被省略可以使用 toString 避免传入 null
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

## 配置

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

## 基础篇小结

以上内容，就是 Retrofit 文档里告诉开发者的一些基本用法，这个库目前也是我最常使用的网络请求库了，那必须是简单了解一下它是怎么实现将 HTTP 请求封装成开发者所熟悉使用的接口？又是怎样开启网络请求？带着这俩疑问准备开始源码篇

## 源码篇

**基本方式**<br/>
源码的阅读，一般先从调用入口开始追踪，逐步捋清调用链，如果从调用入口的方法中获取到的信息比较少，那就从构造的方法开始着手。总之创建、配置、调用，基本上就是这些（有些细节实现的地方，了解阶段应该跳过，不要阻塞对整个流程的了解~）。
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
 * 2、上锁并通过 ServiceMethod.parseAnnotations() 创建实例后存到缓存中
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
到这里，追踪到的是通过 Retrofit#create 可以拿到接口的代理对象，当这个代理对象的方法被执行后，就是执行的 ServiceMethod#invode 并返回接口方法中的范型。那再看 ServiceMethod，ServiceMethod 是一个抽象类，包含一个静态方法 parseAnnotations 和一个抽象的 invoke()
```
abstract class ServiceMethod<T> {
  /**
   * 首先直观上，这个方法会返回一个 HttpServiceMethod
   * 1、拿到 RequestFactory（请求工厂）
   * 2、判断入参的方法返回值类型是否被支持和以及是否为空，不支持或为空都会抛异常
   */
  static <T> ServiceMethod<T> parseAnnotations(Retrofit retrofit, Method method) {
    RequestFactory requestFactory = RequestFactory.parseAnnotations(retrofit, method);

    Type returnType = method.getGenericReturnType();
    if (Utils.hasUnresolvableType(returnType)) {
      throw methodError(
          method,
          "Method return type must not include a type variable or wildcard: %s",
          returnType);
    }
    if (returnType == void.class) {
      throw methodError(method, "Service methods cannot return void.");
    }

    return HttpServiceMethod.parseAnnotations(retrofit, method, requestFactory);
  }

  /**
   * 由于这个方法是抽象的，所以需要看实现它的地方
   */
  abstract @Nullable T invoke(Object[] args);
}

// 分割线

abstract class HttpServiceMethod<ResponseT, ReturnT> extends ServiceMethod<ReturnT> {
  ...
	
  /**
   * HttpServiceMethod 中的实现
   * 1、构造一个 OkHttpCall
   * 2、适配这个 call 对象（主要是适配 Kotlin 的协程）
   * 最终会返回这个 Call 对象，也就是在接口中方法的返回值类型
   * 内部类 CallAdapted、SuspendForResponse、SuspendForBody 这三个类会重写这个方法，同时这三个类也是 HttpServiceMethod
   * 从而可以看出这些根据是否为协程作出了兼容
   * 然后可以看到 adapt 的实现有好多（如 RxJava2CallAdapter..）是用于将 Call 对象转换成对应 API，以便调用
   * 而这个 Adapter 的来源就是创建 Retrofit 时可以传入的
   * OkHttpCall -> HttpServiceMethod
   * 调用在 HttpServiceMethod createCallAdapter -> retrofit.callAdapter
   * Retrofit 维护一个 callAdapterFactories，通过 method（接口方法） 的返回类型进行判断
   * 另外这个 adapt 方法最终都是会执行 call.equeue() 因此，下一步就看看 call.equeue() 做了些什么
   */
  @Override
  final @Nullable ReturnT invoke(Object[] args) {
    Call<ResponseT> call = new OkHttpCall<>(requestFactory, args, callFactory, responseConverter);
    return adapt(call, args);
  }
  
  ...
}
```
分析到 call.equeue()，也就是 OkHttpCall.equeue()
```
@Override
  public void enqueue(final Callback<T> callback) {
    Objects.requireNonNull(callback, "callback == null");

    okhttp3.Call call;
    Throwable failure;

    synchronized (this) {
      if (executed) throw new IllegalStateException("Already executed.");
      executed = true;

      call = rawCall;
      failure = creationFailure;
      if (call == null && failure == null) {
        try {
          // 创建 okhttp3.Call 对象
          call = rawCall = createRawCall();
        } catch (Throwable t) {
          throwIfFatal(t);
          failure = creationFailure = t;
        }
      }
    }

    if (failure != null) {
      // 构建 okhttp3.Call 异常通过失败的回调返回
      callback.onFailure(this, failure);
      return;
    }

    if (canceled) {
      // 属于 okhttp3 中的方法，到 okhttp3 的源码解析时再深入
      call.cancel();
    }

    // 调用 okhttp3.Call#enqueue() 进行网络请求
    call.enqueue(
        new okhttp3.Callback() {
          @Override
          public void onResponse(okhttp3.Call call, okhttp3.Response rawResponse) {
            Response<T> response;
            try {
              // 解析网络响应
              response = parseResponse(rawResponse);
            } catch (Throwable e) {
              throwIfFatal(e);
              callFailure(e);
              return;
            }

            try {
              // 回调成功结果
              callback.onResponse(OkHttpCall.this, response);
            } catch (Throwable t) {
              throwIfFatal(t);
              t.printStackTrace(); // TODO this is not great
            }
          }

          @Override
          public void onFailure(okhttp3.Call call, IOException e) {
            callFailure(e);
          }

          private void callFailure(Throwable e) {
            try {
              // 回调失败结果
              callback.onFailure(OkHttpCall.this, e);
            } catch (Throwable t) {
              throwIfFatal(t);
              t.printStackTrace(); // TODO this is not great
            }
          }
        });
  }
```
在 enqueue() 代码中，有两个地方需要继续研究<br/>
1、通过 `call = rawCall = createRawCall();` 创建 okhttp3.Call 对象的实现<br/>
2、通过 `response = parseResponse(rawResponse);` 解析响应数据的实现<br/>
先看 okhttp3.Call 对象的创建
```
private okhttp3.Call createRawCall() throws IOException {
    /**
     * 通过 callFactory.newCall 创建一个 okhttp3.call 对象
     * 这个 callFactory 来源于 OkHttpCall 的构造方法
     * 而 OkHttpCall 的构造在 HttpServiceMethod#invoke() 中创建（在调用具体接口方法时）
     * 在 invoke 中的 callFactory 是通过 HttpServiceMethod 构造时传入
     * HttpServiceMethod 的构造，是在 parseAnnotations 的过程中构造的（也就是构造前面说的重写 adapt() 的子类）
     * parseAnnotations 中无论创建 CallAdapted、SuspendForResponse 还是 SuspendForBody 都传入了 callFactory，而这个 callFactory 通过 Retrofit#Builder 在构建的时候传入（如果不传，默认是 OkHttpClient）
     * 得出结论 callFactory 实际上是一个 OkHttpClient，也就是通过 OkHttpClient 创建了一个 Call 对象
     * ---
     * 接下来在 newCall() 中传入了 requestFactory.create(args)，这个方法是创建请求对象（okhttp3.Request）
     * 这个 requestFactory 是在 ServiceMethod#invoke 通过 RequestFactory.parseAnnotations() 创建的
     */
    okhttp3.Call call = callFactory.newCall(requestFactory.create(args));
    if (call == null) {
      throw new NullPointerException("Call.Factory returned null.");
    }
    return call;
  }
```
另起一段，看看 RequestFactory 的代码
```
final class RequestFactory {
  static RequestFactory parseAnnotations(Retrofit retrofit, Method method) {
    // 通过 Builder#build 返回实例
    return new Builder(retrofit, method).build();
  }
  
  ...
  
  RequestFactory build() {
    
    // 这里的方法都是对接口方法注解的解析
    // 遍历注解并解析得到 httpMethod、hasBody、params 等信息
    // parseMethonAnnotation 解析方法注解
    // parseHeader 解析 Header 注解
    // parseParameter 解析参数
    // parseParameterAnnotation 解析注解参数
    
    // 经过解析并且解析无误后，就会返回 RequestFactory
    return builder.build();
  }
}
```
RequestFactory 在 ServiceMethod#invoke 中已经完成解析操作，在 `callFactory.newCall(requestFactory.create(args))` 时可将参数直接赋值并通过 create() 返回<br/>
剩下第二点，响应的数据解析实现，接下来看看 OkHttpCall#parseResponse 方法
```
Response<T> parseResponse(okhttp3.Response rawResponse) throws IOException {
    ResponseBody rawBody = rawResponse.body();
    
    ...
    
    ExceptionCatchingResponseBody catchingBody = new ExceptionCatchingResponseBody(rawBody);
    try {
      /*
       * 最终通过 responseConverter.convert() 将响应的 body 进行转换
       * 那就再看看 responnseConverter 的来源
       * 同样通过 OkHttpCall -> HttpServiceMethod
       * 在 HttpServiceMathod#parseAnnotation 中通过 createResponseConverter() -> retrofit.responseBodyConverter() 获得
       * 这个方法是通过遍历在 converterFactories 拿到合适的 converter 返回（通过 callAdapter.responseType 确定）
       * converterFactories 是在 Retrofit#build 中赋值，会添加默认的 coverter 和接收自定义的 converter
       */
      T body = responseConverter.convert(catchingBody);
      return Response.success(body, rawResponse);
    } catch (RuntimeException e) {
      // If the underlying source threw an exception, propagate that rather than indicating it was
      // a runtime exception.
      catchingBody.throwIfCaught();
      throw e;
    }
  }
```
到这里，从开始的调用入口，分析了 callAdapter 的来源以及作用、requestFactory 的来源以及作用、reponseConverter 的来源以及作用、OkHttpCall 的作用，Retrofit 的主体流程就大概了解了，还有个点，在阅读过程中有发现 Retrofit 对 kotlin 的协程做了区分，通过 isKotlinSuspendFunction 来返回 CallAdapted 还是 SuspendForResponse/SuspendForBody，最后来了解一下这块逻辑，顺便看看协程的判断方式<br/>
首先需要明确，kotlin 使用 suspend 关键字修改的方法最终生成一个类的静态方法，这个静态方法最后一个参数的类型是 Continuation（这个接口解释，暂停点后的延续）<br/>
在 HttpServiceMethod#parseAnnotations() 中，有关协程的部分
```
static <ResponseT, ReturnT> HttpServiceMethod<ResponseT, ReturnT> parseAnnotations(
      Retrofit retrofit, Method method, RequestFactory requestFactory) {
    // 获取是否为协程函数
    boolean isKotlinSuspendFunction = requestFactory.isKotlinSuspendFunction;
    boolean continuationWantsResponse = false;
    boolean continuationBodyNullable = false;

    Annotation[] annotations = method.getAnnotations();
    Type adapterType;
    if (isKotlinSuspendFunction) {
      Type[] parameterTypes = method.getGenericParameterTypes();
      Type responseType =
          Utils.getParameterLowerBound(
              0, (ParameterizedType) parameterTypes[parameterTypes.length - 1]);
      if (getRawType(responseType) == Response.class && responseType instanceof ParameterizedType) {
        // Unwrap the actual body type from Response<T>.
        responseType = Utils.getParameterUpperBound(0, (ParameterizedType) responseType);
        // 是协程函数将 continuationWantsResponse 置为 true
        continuationWantsResponse = true;
      } else {
        // TODO figure out if type is nullable or not
        // Metadata metadata = method.getDeclaringClass().getAnnotation(Metadata.class)
        // Find the entry for method
        // Determine if return type is nullable or not
      }

      adapterType = new Utils.ParameterizedTypeImpl(null, Call.class, responseType);
      annotations = SkipCallbackExecutorImpl.ensurePresent(annotations);
    } else {
      adapterType = method.getGenericReturnType();
    }

    CallAdapter<ResponseT, ReturnT> callAdapter =
        createCallAdapter(retrofit, method, adapterType, annotations);
    Type responseType = callAdapter.responseType();
    if (responseType == okhttp3.Response.class) {
      throw methodError(
          method,
          "'"
              + getRawType(responseType).getName()
              + "' is not a valid response body type. Did you mean ResponseBody?");
    }
    if (responseType == Response.class) {
      throw methodError(method, "Response must include generic type (e.g., Response<String>)");
    }
    // TODO support Unit for Kotlin?
    if (requestFactory.httpMethod.equals("HEAD") && !Void.class.equals(responseType)) {
      throw methodError(method, "HEAD method must use Void as response type.");
    }

    Converter<ResponseBody, ResponseT> responseConverter =
        createResponseConverter(retrofit, method, responseType);

    okhttp3.Call.Factory callFactory = retrofit.callFactory;
    if (!isKotlinSuspendFunction) {
      return new CallAdapted<>(requestFactory, callFactory, responseConverter, callAdapter);
    } else if (continuationWantsResponse) {
      //noinspection unchecked Kotlin compiler guarantees ReturnT to be Object.
      // 返回协程响应
      return (HttpServiceMethod<ResponseT, ReturnT>)
          new SuspendForResponse<>(
              requestFactory,
              callFactory,
              responseConverter,
              (CallAdapter<ResponseT, Call<ResponseT>>) callAdapter);
    } else {
      //noinspection unchecked Kotlin compiler guarantees ReturnT to be Object.
      return (HttpServiceMethod<ResponseT, ReturnT>)
          new SuspendForBody<>(
              requestFactory,
              callFactory,
              responseConverter,
              (CallAdapter<ResponseT, Call<ResponseT>>) callAdapter,
              continuationBodyNullable);
    }
  }
```
从上面的代码可以得知 Retrofit 通过 isKotlinSuspendFunction 来判断传入的 Method 是否为协程函数，那就看看它是怎么确认这个值的，在 RequestFactory 的 parseParameter 是对方法进行解析，首先遍历解析参数的注解（@Path、@Query、@Field），下面看看这个方法
```
private @Nullable ParameterHandler<?> parseParameter(
        int p, Type parameterType, @Nullable Annotation[] annotations, boolean allowContinuation) {
      ParameterHandler<?> result = null;
      // 解析注解
      if (annotations != null) {
        for (Annotation annotation : annotations) {
          ParameterHandler<?> annotationAction =
              parseParameterAnnotation(p, parameterType, annotations, annotation);

          if (annotationAction == null) {
            continue;
          }

          if (result != null) {
            throw parameterError(
                method, p, "Multiple Retrofit annotations found, only one allowed.");
          }

          result = annotationAction;
        }
      }

      if (result == null) {
        // 判断最后一个参数（在调用的地方传入的）
        if (allowContinuation) {
          try {
            // 判断参数类型是否为 Continuation 这个接口
            if (Utils.getRawType(parameterType) == Continuation.class) {
              // 是的话，就认为是协程函数
              isKotlinSuspendFunction = true;
              return null;
            }
          } catch (NoClassDefFoundError ignored) {
          }
        }
        throw parameterError(method, p, "No Retrofit annotation found.");
      }

      return result;
    }
```
了解完 isKotlinSuspendFunction 的来源后，再看看 SuspendResponse 的 adapt() 方法
```
static final class SuspendForResponse<ResponseT> extends HttpServiceMethod<ResponseT, Object> {
    private final CallAdapter<ResponseT, Call<ResponseT>> callAdapter;

    SuspendForResponse(
        RequestFactory requestFactory,
        okhttp3.Call.Factory callFactory,
        Converter<ResponseBody, ResponseT> responseConverter,
        CallAdapter<ResponseT, Call<ResponseT>> callAdapter) {
      super(requestFactory, callFactory, responseConverter);
      this.callAdapter = callAdapter;
    }

    @Override
    protected Object adapt(Call<ResponseT> call, Object[] args) {
      // 调用 callAdapter 的 adapt()
      call = callAdapter.adapt(call);

      //noinspection unchecked Checked by reflection inside RequestFactory.
      // 取出最后一个参数并强转为 Continnuation 类型
      Continuation<Response<ResponseT>> continuation =
          (Continuation<Response<ResponseT>>) args[args.length - 1];

      // See SuspendForBody for explanation about this try/catch.
      try {
        /**
         * 执行扩展函数 awaitResponse
         * 这个对 Call 进行了扩展
         * 结合协程的调用方式调用 Call#equeue
         * 在 onResponse 中通过 continuation.resume(response) 返回成功回调
         * 在 onFailure 中通过 continuation.resumeWithExceptionn(t) 返回失败回调
         */
        return KotlinExtensions.awaitResponse(call, continuation);
      } catch (Exception e) {
        // 出问题则抛出异常
        return KotlinExtensions.suspendAndThrow(e, continuation);
      }
    }
  }
```

## 源码篇小结

经过上面的阅读路径基本上了解 Retrofit 的流程<br/>
**API 总结**<br/>
Retrofit: 使用动态代理配合 Builder 构建出对应接口的对象，支持传入 RequestFactory、CallAdapter、Converter 同时也有会默认实现<br/>
Platform: 用于调用平台的判断，区分 java8、Android<br/>
ServiceMethod: 接口方法的抽象<br/>
RequestFactory: 请求工厂，用于解析接口方法中的注解，包括方法注解、方法参数注解等<br/>
HttpServiceMethod: Http 接口方法，继承自 ServiceMethod，用于创建并适配请求（CallAdapter），其中有兼容协程的方法（默认返回 CallAdapted，是协程会返回 SuspendForResponse / SuspendForBody）这三个都继承自 HttpServiceMethod 且是它的内部类<br/>
CallAdapter: 通过判断返回值类型适配不同的请求，可以通过 Builder#addCallAdapterFactory 添加自定义的 CallAdapter<br/>
OkHttpCall: 具体的请求封装，在这里调用了 okhttp3 相关的 api 发起实际的网络请求<br/>
Converter: 响应体转换器，默认是 ResponseBody，常用的有 GsonResponseBodyConverter<br/>
CallBack: 响应回调<br/>
**调用流程**<br/>
在调用接口方法进行请求时，首先接口实例的 InvocationHandler#invoke 会被调用，然后看 Retrofit#serviceMethodCache 中有没有缓存的接口实例，没有就创建，有就先解析注解参数，然后调用 HttpServiceMethod#invoke 适配请求（根据接口方法的返回值类型进行适配），默认是 CallAdapted，协程则是 SuspendForResponse / SuspendForBody，在构建这些类的时候，会将 Converter 也构建完毕，构建完毕后，会调用 adapt()，这个方法会调用 OkhttpCall 的 enqueue 进行实际的网络请求，收到响应后会通过 Converter 解析返回的响应数据并回调 CallBack 接口<br/>
**问题**<br/>
1、方法的注解什么时候解析，怎样解析
- 在创建 HttpServiceMthod 实例之前进行解析
- 通过 RequestFactory 的静态方法 parseAnnotations() 创建对象并在 Builder 构建之前解析完毕

2、Converter 的转换过程
- 在 OkHttpCall#equeue 的 onResponse 回调中调用 parseResponse，其中通过 responseConverter 对响应数据进行解析
- responseConverter 在 converterFactories 中通过返回值类型匹配

3、CallAdapter 的适配过程
- 在 callAdapterFactories 通过接口方法返回值类型进行匹配

4、如何支持 Kotlin 协程的 suspend 挂起函数
- RequestFactory 解析方法的参数来判断（参数最后一个类型为 Continuation.class）RequestFactory#isKotlinSuspendFunction 即认为是 kotlin 的 suspend 函数
- 通过 RequestFactory#isKotlinSuspendFunction 这个值在 HttpServiceMethod 中就会返回对应的 SuspendForResponse / SuspendForBody，其中的 adapt() 通过 KotlinExtensions.awaitResponse 来完成协程的执行并通过 Callback 进行回调

## 思考

了解完 Retrofit 这个库的代码后，发现涉及到的主要技能点都跟 Java 相关，如动态代理、Class 的理解、注解的定义与解析、接口的判断甚至 Kotlin 中协程的判断，这些点都是 Java 中比较优秀的特性，这个库将这些特性娴熟运用，所以使用者会觉得很好用。但是我想要了解的网络相关的流程并没有在这个库中很明显得体现出来，现在可以理解其它文章说的 Retrofit 是将 okhttp 封装了一层后方便开发者使用的库，下一步就了解一下 okhttp 里的流程，看看他是否会将网络请求的流程比较完整地体现出来。

## 参考资料

[官方文档](https://square.github.io/retrofit/)<br/>
[AboBack - 一定能看懂的 Retrofit 最详细的源码解析！](https://juejin.cn/post/6869584323079569415#heading-29)<br/>
[从一道面试题开始说起 枚举、动态代理的原理](https://blog.csdn.net/lmj623565791/article/details/79278864)<br/>





