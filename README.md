fis-postprocessor-amd
===========================

识别 js 中 amd 依赖，自动包转 isMod  的 js 为 amd.


## 如何使用？

```
npm install -g fis-postprocessor-amd
```

配置 fisconf.js

```
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

相比原来的 jswrapper 对于 amd 文件包装更智能，提供依赖自动前置功能。

全局的异步 require(deps, callback) 中的依赖会被提前加载进来， 减少 http 请求数。

当然在 module 中的异步不会把依赖提前加载进来。