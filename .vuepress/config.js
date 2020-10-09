module.exports = {
  title: '日常划水',
  description: '今日事，今日毕',
  base: '/',
  dest: 'dist/',
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['link', { rel: 'manifest', href: '/manifest.json' }],
    ['meta', { name: 'theme-color', content: '#4169E1' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }],
    ['meta', { name: 'renderer', content: 'webkit' }],
    ['meta', { name: 'force-rendering', content: 'webkit' }],
    ['meta', { name: 'applicable-device', content: 'pc,mobile' }],
    ['meta', { name: 'author', content: 'zak <linhenji17@gmail.com>' }],
    ['meta', { name: 'copyright', content: '网站内容版权所有，转载请注明出处' }],
    ['meta', { name: "keywords", content: "日常划水, 博客总结, 安卓开发, zakli.cn" }]
  ],
  locales: { '/': { lang: 'zh-CN' }},
  theme: 'ououe',
  themeConfig: {
    cover: '/img/night.jpg',
    backgroundImage: false,
    nav: [
      { text: '首页', link: '/' },
      { text: '安卓', link: '/android/' },
      { text: '标签', link: '/tag/' },
      { text: '分类', link: '/category/' },
      { text: '关于', link: '/about/' }
    ],
    footer: [
      { text: '粤ICP备19159883号-1', link: '' },
      { text: 'ZakAnun', link: ''},
      { text: 'Github', link: 'https://github.com/ZakAnun' },
      { text: 'Base vuepress-theme-ououe', link: 'https://github.com/tolking/vuepress-theme-ououe' }
    ]
  },
  markdown: {
    lineNumbers: true
  },
  plugins: [
    // permalink for posts
    ['blog-multidir', {
      postsDir: {
        posts: 'posts/:year/:month/:day/:slug'
      }
    }],
    // add vuepress-plugin-container
    ['container', {
      type: 'right',
      defaultTitle: ''
    }],
    ['container', {
      type: 'tip',
      before: info => `<div class="tip"><p class="title">${info}</p>`,
      after: '</div>'
    }],
    ['container', {
      type: 'warning',
      before: info => `<div class="warning"><p class="title">${info}</p>`,
      after: '</div>'
    }],
    ['container', {
      type: 'danger',
      before: info => `<div class="danger"><p class="title">${info}</p>`,
      after: '</div>'
    }]
  ]
}