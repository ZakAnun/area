---
title: Vuepress 基本配置
display: home
description: vuepress basic desc
image: https://picsum.photos/536/354?random&date=2020-10-15
date: 2020-10-15
vssue-title: vuepress basic config
tags:
  - config
categories:
  - web
---

### 概述
之前有接触过一些前端的开发，用的技术是 vue，后来发现有 Vuepress 这个可以生成文档的工具，也看到很多开发者都使用它来形成自己的博客，所以就准备用 Vuepress 完成博客的搭建，基本配置跟官网上的教程类似，如果想要多了解一下 Vuepress，可以到 [中文网](http://caibaojian.com/vuepress/) 了解

---

### 执行
基本目录结构如下:<br/>
|- area<br/>
&emsp;|- .vuepress<br/>
&emsp;&emsp;|- public<br/>
&emsp;&emsp;|- theme<br/>
&emsp;|- config.js<br/>
|- article directory<br/>
|- package.json <br/>

步骤:<br/>
1、创建博客目录，我是创建了名为 [area](https://github.com/ZakAnun/area) 的文件夹，博客的文件都在这里面<br/>
2、创建 [.vuepress](https://github.com/ZakAnun/area/tree/master/.vuepress) 目录，博客的 UI 会根据这个目录下的文件展示<br/>
3、创建文章目录（如 [android](https://github.com/ZakAnun/area/tree/master/android)），文章以 md 文件区分<br/>
4、创建并配置 [package.json](https://github.com/ZakAnun/area/blob/master/package.json)<br/>
4、创建并配置 [config.js](https://github.com/ZakAnun/area/blob/master/.vuepress/config.js)<br/>
5、运行（`yarn run dev`）即可通过 localhost 进行访问<br/>

---

### 问题
1、修改默认主题<br/>
在中文文档里面有提及，通过继承的方式可以改变默认的主题，并且同名的组件会覆盖被继承的主题组件，这个操作在 [index.js](https://github.com/ZakAnun/area/blob/master/.vuepress/theme/index.js) 文件下面完成<br/>
2、资源路径问题<br/>
vuepress 会根据 [config.js](https://github.com/ZakAnun/area/blob/master/.vuepress/config.js) 中 base 和 dist 所指定的值作为查询标准，base 默认指向 .vuepress，因此在放置图片资源的是否可以在 .vuepress 目录下进行操作<br/>
3、运行环境问题<br/>
参考 [前端开发环境配置](https://www.zakli.cn/web/web-env.html) 进行处理<br/>

---

### 结束

经过上述步骤，本地的 Vuepress 文档已经成功搭建完成，并且可以像平时开始前端业务那样进行调整，达到自己预期的页面效果
另外附上我使用的 [主题](https://github.com/tolking/vuepress-theme-ououe)