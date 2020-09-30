module.exports = {
    title: '日常划水',
    base: '/',
    dest: 'dist/',
    head: [
      ['meta', { name: 'copyright', content: '网站内容版权所有，转载请注明出处' }],
      ['meta', { name: "keywords", content: "zakli.cn" }]
    ],
    locales: { '/': { lang: 'zh-CN' }},
    theme: 'ououe',
    themeConfig: {
      cover: '/night.jpg',
      backgroundImage: false,
      nav: [
        { text: 'Home', link: '/' },
        { text: 'Android', link: '/android/' },
        { text: 'Category', link: '/category/' },
        { text: 'About', link: '/about/' }
      ],
      footer: [
        { text: '粤ICP备19159883号-1', link: '' },
        { text: 'ZakAnun', link: ''},
        { text: 'Github', link: 'https://github.com/ZakAnun' },
        { text: 'Base vuepress-theme-ououe', link: 'https://github.com/tolking/vuepress-theme-ououe' }
      ]
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