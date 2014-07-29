fis-postprocessor-amd
===========================

fis amd 支持，完全满足 [amdjs](https://github.com/amdjs/amdjs-api) 规范。


## 如何使用？

```bash
npm install -g fis-postprocessor-amd
```

配置 fisconf.js

```javascript
fis.config.merge({
    modules: {

        postprocessor: {
            tpl: 'amd',
            js: 'amd'
        }
    }
});
```

## 说明

1. 相比原来的 jswrapper 对于 amd 文件包装更智能，提供依赖自动前置功能。
2. 全局的异步 require(deps, callback) 中的依赖会被提前加载进来， 减少 http 请求数。（当然在 module 中的异步不会把依赖提前加载进来。）
3. 支持以下各种用法：

    ```javascript
    define({
        xxx: 123
    });

    define(function(require, exports, module) {
        exports.xxx = 123;
    });

    define(function(require, exports, module) {
        module.exports = {
            xxx: 123
        }
    });

    define(['require', 'exports', 'module'], function(require, exports, module) {
        module.exports = {
            xxx: 123
        }
    });

    define(['a', 'b'], function(A, B) {
        module.exports = {
            xxx: A
        }
    });
    ```

    或者自定义  module id。

    ```
    define('base', function() {

    });
    ```
4. 关于依赖写法（文件后缀.js 可写可不写）
    * 相对路径 `./a` 或者 `../parent/a`
    * 绝对路径 `/module/a`
    * 原来的 fis id 写法 `namespace:xxx/xxx.js`
    * module package

        比如： `zrender`, `echarts/chart/line`

        遇到这类依赖引用，默认按一下顺序查找实现：

        - 尝试在 `baseUrl` 配置中找。
        - paths 中是否有定义。
        - packages 中是否有定义。

        比如：更多信息请查看[amdjs 中config 说明](https://github.com/amdjs/amdjs-api/blob/master/CommonConfig.md)。不同的是这里路径是相对于本地文件夹项目目录，而那边是相对于页面的目录。

        ```javascript
        fis.config.merge({

            settings: {
                postprocessor: {
                    amd: {
                        baseUrl: './widget/lib/',
                        paths: {

                            // 相对于  baseUrl 
                            // 如果是绝对路径则相对与 root.
                            // base 的值可以是字符串，也可以是数组，会按顺序超找。
                            base: './base/base.js'
                        },
                        packages: [
                            {
                                name: 'zrender',
                                location: 'zrender',
                                main: 'zrender'
                            },

                            {
                                name: 'echarts',
                                location: 'echarts',
                                main: 'echarts'
                            }
                        ]
                    }
                }
            }
        });
        ```



