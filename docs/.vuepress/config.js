const { config } = require("vuepress-theme-hope");

module.exports = config({
  title: "扎克的博客",
  description: "简单记录一下学习的技术",

  dest: "./dist",

  head: [
    [
      "script",
      { src: "https://cdn.jsdelivr.net/npm/react/umd/react.production.min.js" },
    ],
    [
      "script",
      {
        src: "https://cdn.jsdelivr.net/npm/react-dom/umd/react-dom.production.min.js",
      },
    ],
    ["script", { src: "https://cdn.jsdelivr.net/npm/vue/dist/vue.min.js" }],
    [
      "script",
      { src: "https://cdn.jsdelivr.net/npm/@babel/standalone/babel.min.js" },
    ],
  ],

  locales: {
    "/": {
      lang: "zh-CN",
    },
  },

  themeConfig: {
    logo: "/logo.svg",
    hostname: "https:www.zakli.cn",

    author: "扎克",
    // repo: "https://github.com/ZakAnun",
    // repoLabel: "我的Github",
    // 文档仓库地址
    docsRepo: "https://github.com/ZakAnun/area",
    // 禁用导航栏
    // navbar: false,
    // 禁用侧边栏
    sidebarIcon: false,
    // 禁用搜索框
    search: false,
    // 隐藏编辑本页链接
    editLinks: false,

    blog: {
      intro: "/docs/about/"
    },

    footer: {
      display: true,
    },

    comment: {
      type: "vssue",
      platform: "github-v4",
      owner: "ZakAnun",
      repo: "https://github.com/ZakAnun/area",
      clientId: "3935698d7c02cb14b2d4",
      clientSecret: "77d1ca5a159d70a5f0034ac272c95861f0fa5bc5",
    },

    copyright: {
      status: "global",
      noSelect: true,
    },

    git: {
      timezone: "Asia/Shanghai",

    },

    mdEnhance: {
      enableAll: true,
      presentation: {
        plugins: [
          "highlight",
          "math",
          "search",
          "notes",
          "zoom",
          "anything",
          "audio",
          "chalkboard",
        ],
      },
    },

    pwa: {
      favicon: "/favicon.ico",
      cachePic: true,
      apple: {
        icon: "/assets/icon/apple-icon-152.png",
        statusBarColor: "black",
      },
      msTile: {
        image: "/assets/icon/ms-icon-144.png",
        color: "#ffffff",
      },
      manifest: {
        icons: [
          {
            src: "/assets/icon/chrome-mask-512.png",
            sizes: "512x512",
            purpose: "maskable",
            type: "image/png",
          },
          {
            src: "/assets/icon/chrome-mask-192.png",
            sizes: "192x192",
            purpose: "maskable",
            type: "image/png",
          },
          {
            src: "/assets/icon/chrome-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/assets/icon/chrome-192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
    },
  },
});
