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
2. `genAsyncDeps` 默认为 `true` 是否对异步依赖生成资源表。对于有异步依赖的文件，都会自动的生成一个 `同名文件` + 'async-map.js' 文件，并让此文件依赖新生成的 `async-map.js`。以下是一个示例文件。

    ```javascript
    require.config({"paths":{
        "amdtest/widget/lib/base/util": "/amdtest/widget/lib/base/util_51e59c9",
        "base": "/amdtest/widget/lib/base/base_288c046"
    }});
    ```
3. `globalAsyncAsSync` 默认为 `true`，因为全局 `require` 方法不支持同步加载，只能异步加载。

    ```javascript
    require(['xxx'], function() {

    });
    ```

    为了减少 http 请求数，此工具会把全局环境（不在 define 中）下 require([xxx], cb) 的用法认为是同步加载，会提前把相应依赖加载进来。

    如果不想启用此用法，请关闭此配置项，或者把异步 require 放在 define 中，然后同步引用新 define 的 moudle 来实现。
4. `moduleIdTpl` 默认为 `${namespace}${subpathNoExt}` 此为 fis 默认给匿名 define 自动的补的 module id 模板。可以是使用 fis.config 变量，或者 file 里面的属性变量。
5. `baseUrl` fis 中对 module id  的查找根目录。
6. `paths` 请查看上面的说明
7. `packages` 请查看上面的说明

