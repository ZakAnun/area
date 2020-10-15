<template>
    <div class="u-valine">
      <span :id="$page.relativePath"
            class="leancloud_visitors"
            :data-flag-title="$page.title">
        <span class="stat read-count content">
            <em class="post-meta-item-text">阅读量: </em>
            <i class="leancloud-visitors-count"></i>
        </span>
      </span>
    </div>
</template>

<script>
export default {
    name: 'Valine',

    mounted() {
        // valine库里面存在window变量；HTML会通过NodeJS进行服务端渲染来产生
        // 通过动态导入来解决“NodeJS环境下对window变量未定义”的问题
        import('valine').then(module => {
            const Valine = module.default

            if (typeof window !== 'undefined') {
                const isDev = window.location.hostname.includes('localhost');
                if (isDev) return; // 不统计本地开发时的阅读量

                document.getElementsByClassName('leancloud_visitors')[0].id = window.location.pathname
                this.window = window
                window.AV = require('leancloud-storage')

                this.valine = new Valine()
                this.initValine()
            }
        })
    },

    methods: {
        initValine () {
            let path = window.location.pathname
            document.getElementsByClassName('leancloud_visitors')[0].id = path

            this.valine.init({
                el: '#vcomments',
                appId: 'UtaHd8r9DCUFD1gxFwuzGhgl-9Nh9j0Va',// your appId
                appKey: 'b0Fb2NHcggRF0KKBJoDgGrzQ',// your appKey
                notify: false,
                verify: false,
                path,
                visitor: true,
                avatar: 'mm',
                placeholder: 'write here'
            })
        }
    },

    watch: {
        $route (to, from) {
            if (from.path !== to.path) {
                this.initValine()
            }
        }
    }
}
</script>

<style scoped>
.icon {
    width: 14px;
    margin-right: 4px;
    vertical-align: middle;
    opacity: 1;
}

.leancloud-visitors-count {
    vertical-align: middle;
}

.stat {
    font-size: 12px;
    opacity: .6;
}

.stat::after {
    content: "|";
    opacity: .4;
    margin: 0 6px;
}

.stat:last-child::after {
    content: " ";
}

.content {
    color: #eaecef;
    text-shadow: 0 1px 5px rgba(0,0,0,.3);
}
</style>