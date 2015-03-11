fis-postprocessor-amd
===========================

fis amd 支持，完全满足 [amdjs](https://github.com/amdjs/amdjs-api) 规范。[demo][]


## 如何使用？

```bash
npm install -g fis-postprocessor-amd
```

配置 fis-conf.js

```javascript
fis.config.merge({
    modules: 
        postprocessor: {
            tpl: 'amd', // 如果你的模板是.tpl结尾的模板，如 Smarty、Swig 模板
            js: 'amd',
            html: 'amd' // 如果你的项目中也有一些 html 文件需要使用 AMD
        }
    }
});
```

## 说明

1. 支持以下各种用法：

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

    或者自定义  module id。不推荐

    ```
    define('base', function() {

    });
    ```
1. 关于依赖写法（文件后缀.js 可写可不写）
    * 相对路径 `./a` 或者 `../parent/a`
    * 绝对路径 `/module/a` （基于baseUrl的绝对路径）
    * 原来的 fis id 写法 `namespace:xxx/xxx.js`
    * module package

        比如： `zrender`, `echarts/chart/line`

        遇到这类依赖引用，默认按一下顺序查找实现：

        - 尝试在 `baseUrl` 配置中找。
        - paths 中是否有定义。
        - packages 中是否有定义。

        类似于[amdjs 中config](https://github.com/amdjs/amdjs-api/blob/master/CommonConfig.md)。不同的是这里路径是相对于本地文件夹项目目录，而那边是相对于页面的目录。

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
                                name: 'echarts',
                                location: 'echarts',
                                main: 'echarts'
                            },

                            {
                                name: 'zrender',

                                // 可以指定其他模块的路径。
                                location: 'common:widget/libs/zrender',
                                main: 'zrender'
                            }
                        ]
                    }
                }
            }
        });
        ```
1. 相比原来的 jswrapper 对于 amd 文件包装更智能，提供依赖自动前置功能。
1. 全局的异步 require(deps, callback) 中的依赖会被提前加载进来， 无需另起请求，且可以通过 fis 打包配置将依赖合并成单一文件引入，减少请求数。（当然在 module 中的异步不会把依赖提前加载进来。）


## 配置项说明

1. `forwardDeclaration` 默认为 `true` 是否进行依赖前置转换。这样做可以让 amd 加载器更快解析到依赖。

    before:

    ```javascript
    define(function(require) {
        var a = require('./a');
        var b = require('./b');

        return {

        }
    });
    ```

    after

    ```javascript
    define('moduleId', ['require', './a', '.b'], function(require) {
        var a = require('./a');
        var b = require('./b');

        return {

        }
    });
    ```
2. `noOnymousModule` 默认为 `false`，不允许署名模块，设置为 true 后，署名模块将被当作匿名模块处理。
3. `globalAsyncAsSync` 默认为 `true`，因为全局 `require` 方法不支持同步加载，只能异步加载。

    ```javascript
    require(['xxx'], function() {

    });
    ```

    此工具会把全局环境（不在 define 中）下 require([xxx], cb) 的用法认为是程序的入口，会提前把相应依赖加载进来。

    如果不想启用此用法，请关闭此配置项，或者把异步 require 放在 define 中，然后同步引用新 define 的 moudle 来实现。
5. `scriptsReg` 默认只识别以下写法的 script 片段，可以通过扩展此数组来支持其他格式。

    ```tpl
    <script type="text/javascript">js 片段</script>
    {%script%}js 片段{%/script%}
    {% script %}js 片段{% endscript %}
    ```

6. `baseUrl` fis 中对 module id  的查找根目录。
7. `paths` 请查看上面的说明
8. `packages` 请查看上面的说明

## 注意

- 在用[fis][]时，**合并打包** AMD 组件时，需要使用 fis 的另一个合包插件[fis-postpackager-autoload][]，可以查看[demo][]中的`fis-conf.js`的设置；
- 在用[fis-plus][]时，参考[fisp的demo][]；

[fis-postpackager-autoload]: https://www.npmjs.com/package/fis-postpackager-autoload
[demo]: https://github.com/fex-team/fis-amd-demo
[fis]: https://github.com/fex-team/fis
[fisp的demo]: https://github.com/fex-team/fisp-amd-demo
[fis-plus]: https://github.com/fex-team/fis-plus
