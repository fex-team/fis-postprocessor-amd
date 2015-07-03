/**
 * @fileOverview 解析 js 中 amd 依赖。
 *
 * 功能介绍：
 *
 * 1. amd 包装 js 代码。如果已经 包装过则不包装。
 * 2. 给匿名 module 设置 module id.
 * 3. 添加同步和异步依赖到 map.json 文件里面。
 * 4. 依赖前置
 */
var getInfo = require('./lib/info.js');
var pth = require('path');
var map;

// 将正则特殊字符转义。
function pregQuote (str, delimiter) {
    return (str + '').replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + (delimiter || '') + '-]', 'g'), '\\$&');
}

// 在第一次使用的时候初始化
var inited = false;
function init(conf) {

    // 避免重复执行。
    if (inited) {
        return;
    }

    // 左分隔符
    var ld = conf.left_delimiter ||
            fis.config.get('settings.template.left_delimiter') ||
            fis.config.get('settings.smarty.left_delimiter') || '{%';

    // 右分隔符
    var rd = conf.right_delimiter ||
            fis.config.get('settings.template.right_delimiter') ||
            fis.config.get('settings.smarty.right_delimiter') || '%}';

    // 正则特殊字符转义
    ld = pregQuote(ld);
    rd = pregQuote(rd);

    var reg;

    // smarty script tag
    reg = new RegExp('('+ld+'script(?:|[\\s\\S]+?)'+rd+')([\\s\\S]*?)(?='+ld+'\\/script'+rd+')', 'ig');
    parser.scriptsReg.push(reg);

    // swig script tag
    reg = new RegExp('('+ld+'\\s*script(?:|[\\s\\S]+?)' +
            rd + ')([\\s\\S]*?)(?=' + ld + '\\s*endscript\\s*' +
            rd + ')', 'ig');

    parser.scriptsReg.push(reg);

    // 其他标签，请通过 exports.scriptsReg 扩展。

    // 用户也可以扩展，读取用户自定义脚本正则。
    if (conf.scriptsReg) {
        if (Array.isArray(conf.scriptsReg)) {
            parser.scriptsReg.push.apply(parser.scriptsReg, conf.scriptsReg);
        } else {
            parser.scriptsReg.push(conf.scriptsReg);
        }
    }

    // 读取 components 配置。
    var componentsDir = (fis.config.get('component.dir') || '/components').replace(/\/$/, '');

    if (componentsDir[0] !== '/') {
        componentsDir = '/' + componentsDir;
    }

    var root = fis.project.getProjectPath();
    var includer =  new RegExp('^' + fis.util.escapeReg(root + componentsDir + '/') + '.*?component\.json$', 'i');

    fis.util.find(root, includer).forEach(function(file){
        var cName = pth.basename(pth.dirname(file));
        var json = {};

        try {
            json =require(file)
        } catch (e) {
            fis.log.warning('unable to load component.json of [' + cName + ']');
        }

        json.name = json.name || cName;

        conf.packages.push({
            name: json.name,
            location: componentsDir + '/' + cName,
            main: json.main || 'main'
        });

        if (json.shim) {
            Object.keys(json.shim).forEach(function(path) {
                conf.shim[componentsDir + '/' + cName + '/' + path] = json.shim[path];
            });
        }
    });

    conf.packages = conf.packages.map(function(item) {

        if (typeof item === 'string') {
            item = {
                name: item
            }
        }

        return item;
    });

    // normalize shim
    if (conf.shim) {
        var shim = conf.shim;
        var normalized = {};
        var paths = conf.paths || {};
        var baseUrl = conf.baseUrl || '.';
        var root = fis.project.getProjectPath();
        var packages = conf.packages || [];

        Object.keys(shim).forEach(function(key) {
            var val = shim[key];
            var info, filepath, pkg;

            if (paths[key]) {
                filepath = pth.join(baseUrl, paths[key]);
                info = fis.uri(filepath, root);
                info.file || (info = fis.uri(filepath + '.js', root));
            } else if ((pkg = findPkg(key, packages))) {
                // todo
            } else {
                info = fis.uri(key, root);
            }

            if (!info.file) {
                return;
            }

            key = info.file.subpath;

            if (Array.isArray(val)) {
                val = {
                    deps: val
                }
            }

            normalized[key] = val;
        });

        conf.shim = normalized;
    }

    map = (function() {
        var id = fis.util.md5(fis.project.getProjectPath(), 10);
        var tmpFile = fis.project.getTempPath('plugin/amd-' + id + '.json');
        var clean = false;
        var opt;

        try {
            var args = process.title;
            if (/\-[^\- ]*c/.exec(args) || /\-\-clean/i.exec(args)) {
                clean = true;
            }
        } catch (e) {
            //
        }

        if (fis.util.exists(tmpFile)) {
            if (clean) {
                fis.util.del(tmpFile);
            } else {
                opt = fis.util.readJSON(tmpFile);
            }
        }

        opt = opt || {};

        return {
            get: function(key) {
                return key ? opt[key] : opt;
            },

            set: function(key, val) {
                opt[key] = val;
            },

            save: function() {
                fis.util.write(tmpFile, JSON.stringify(opt));
            }
        }
    })();

    inited = true;
}

var parser = module.exports = function(content, file, conf) {

    if (file.useAMD === false) {
        return content;
    }

    init(conf);

    // 标记一下，避免重复compile
    hash[file.realpath] = true;

    file.extras = file.extras || {};

    // 异步依赖
    file.extras.async = file.extras.async || [];

    // 同步依赖表，  module id: map id
    file.extras.paths = file.extras.paths || {};

    if (file.isHtmlLike) {
        content = parser.parseHtml(content, file, conf);
    } else if (file.isJsLike) {
        content = parser.parseJs(content, file, conf);
    }

    // 减少 map.json 体积，把没用的删了。
    file.extras.async.length || (delete file.extras.async);
    isEmptyObject(file.extras.paths) && (delete file.extras.paths);
    isEmptyObject(file.extras) && (delete file.extras);

    delete hash[file.realpath];
    return content;
};

// 插件默认配置项。
parser.defaultOptions = {
    // 是否把 amd define 定义模块依赖提前。
    forwardDeclaration: true,

    // 总开关，是否把全局环境下的 require([xxx], cb); 写法当成同步，提前加载依赖。
    globalAsyncAsSync: true,

    // 忽略署名的模块
    // 如果要让模块跨 namespace 依赖，如果目标模块是署名的，很容易出问题。
    // 建议将此属性设置成 true.
    noOnymousModule: false,

    // module id 模板
    moduleIdTpl: function(file) {
        return file.id.replace(/\.js$/, '');
    },

    // 用于定位模块文件用的.
    baseUrl: '.',
    paths: {},
    packages: [],
    shim: {}
};

// 默认 script 正则
parser.scriptsReg = [
    /(<script(?:|[\s\S]+?)>)([\s\S]*?)(?=<\/script>|$)/ig
];

// like array.splice
function strSplice(str, index, count, add) {
    return str.slice(0, index) + add + str.slice(index + count);
}

// 避免嵌套重复 compile
var hash = {};
function compileFile( file ) {
    var id = file.realpath;

    if (hash[id] || file.compiled) {
        return;
    }

    hash[id] = true;
    fis.compile(file);
    delete hash[id];
}

function getKeyByValue(obj, val) {
    var keys = Object.keys(obj);
    var len = keys.length;
    var i = 0;
    var key;

    if (!val) {
        return null;
    }

    for (; i < len; i++) {
        key = keys[i];
        if (obj[key] === val) {
            return key;
        }
    }

    return null;
}

function getModuleId(ref, file, conf, modulename) {
    var key;

    if (file.extras && file.extras.moduleId) {
        return file.extras.moduleId;
    }

    // ref 为用户指定的 module id 原始值
    if (ref && !conf.noOnymousModule) {
        if (ref[0] !== '.' && ref[0] !== '/' && map.get(ref)) {
            // 非相对路径且非绝对路径，则看看这个 module id 是否已经定义过。
            // 如果定义过，则保留不变。
            return ref;
        } else if (modulename && (key = pth.join(pth.dirname(modulename), ref)) && map.get(key)) {
            return key;
        } else if ((key = getKeyByValue(map.get(), file.subpath))) {
            // ref 为其他情况下，看这个文件是否有自定义的 module id, 有则用自定义的。
            return key;
        }
    }

    // 根据模板生成 module id.
    if (conf.moduleIdTpl) {

        // 如果是 function
        if (typeof conf.moduleIdTpl === 'function') {
            return conf.moduleIdTpl.call(null, file);
        }

        return conf.moduleIdTpl.replace(/\$\{([^\}]+)\}/g, function(all, $1){
            var val = file[$1] || fis.config.get($1);

            return val || '';
        });
    } else {
        return file.moduleId || file.id;
    }
};

// 生成转换坐标为位置的函数。
function getConverter(content) {
    var rbr = /\r\n|\r|\n/mg;
    var steps = [0], m;

    while((m = rbr.exec(content))) {
        steps.push(m.index + m[0].length);
    }

    return function(line, column) {
        if (steps.length < line) {
            return -1;
        }

        return steps[line-1] + column;
    };
};

// 包装成 amd 格式。
function wrapAMD(content, file, conf, shim) {

    shim = shim || {};

    var moduleId = shim.id || getModuleId('', file, conf);

    var prefix = 'define(\'' + moduleId + '\', function(require, exports, module) {\n';
    var affix = '\n});';

    if (shim.deps) {
        shim.deps.forEach(function(dep) {
            prefix += 'require(\'' + dep + '\');\n';
        });
    }

    if (shim.init) {
        affix = 'modules.exports = ('+shim.init+')('+(function() {
            var deps = [];

            if (shim.deps) {
                shim.deps.forEach(function(dep) {
                    deps.push('require(\''+ dep +'\')');
                });
            }

            return deps.join(', ');
        })()+');\n' + affix;
    } else if (shim.exports) {
        affix = '\nmodule.exports = ' + shim.exports + ';\n' + affix;
    }

    return prefix + content + affix;
}

function isEmptyObject(obj) {

    for (var key in obj) {
        return false;
    }

    return true;
}

// 查找 conf.packages 是否有对应的定义。
function findPkg(pkg, list) {
    var i = 0;
    var len = list.length;


    for (; i < len; i++) {
        if (list[i].name === pkg) {
            return list[i];
        }
    }

    return null;
}

function findPkgByPath(list, id, file, baseUrl, root) {
    var i = 0;
    var len = list.length;
    var current, item;

    if (id[0] === '/') {
        current = pth.resolve(id, baseUrl);
    } else {
        current = pth.resolve(id, file.dirname);
    }


    for (; i < len; i++) {
        item = list[i];

        if (
            pth.resolve(baseUrl, item.location) === current ||
            pth.resolve(root, item.location) === current
                ) {
            return list[i];
        }
    }

    return null;
}

// 查找 module id.
// 具体请查看 https://github.com/amdjs/amdjs-api/blob/master/CommonConfig.md
//
// 目前以下配置项是有效的。
//  paths
//  baseUrl
//  packages
function resolveModuleId(id, file, conf, modulename) {
    var paths = conf.paths || {};
    var pkgs = conf.packages || [];
    var baseUrl = conf.baseUrl || '.';
    var root = fis.project.getProjectPath();
    var connector = fis.config.get('namespaceConnector', ':');
    var dirname = file.dirname;
    var pluginPath, info, m, pkg, path, dirs, item, main;
    var dir, lastdir, i, len, ns, subpath, idx, sibling, resolved;

    // 支持 amd plugin
    idx = id.indexOf('!');
    if (~idx) {
        pluginPath = id.substring(idx + 1);
        id = id.substring(0, idx);
    }

    if (pluginPath) {
        info = fis.uri(pluginPath, file.dirname);
        if (info.file && info.file.isFile()) {

            if (info.file.useHash && fis.compile.settings.hash) {
                compileFile(info.file);
            }

            var query = (info.file.query && info.query) ? '&' + info.query.substring(1) : info.query;
            var url = info.file.getUrl(fis.compile.settings.hash, fis.compile.settings.domain);
            var hash = info.hash || info.file.hash;
            pluginPath = info.quote + url + query + hash + info.quote;
        }

        info = null;
    }

    // convert baseUrl
    if (baseUrl[0] !== '/') {
        baseUrl = pth.join(root, baseUrl);
    }
    baseUrl = pth.resolve(baseUrl);

    if (id === '.' || id.substring(id.length-1) === '/') {
        // 真麻烦，还得去查找当前目录是不是 match 一个 packagers。
        // 如果是，得找到 main 的设置。
        pkg = findPkgByPath(pkgs, id, file, baseUrl, root);
        main = pkg && pkg.main || 'main';

        id = id === '.' ? './' + main : id + main;
    }

    idx = id.indexOf(connector);
    if (~idx && (ns = id.substring(0, idx))) {
        subpath = id.substring(idx + 1);

        if (ns == fis.config.get('namespace')) {
            info = fis.uri(subpath, root);
            info.file || (info = fis.uri(subpath + '.js', root));
        } else {
            //  不处理其他模块的
            return {
                isFisId: true,
                path: id + (/\.js$/.test(id)?'':'.js'),
                pluginPath: pluginPath
            }
        }
    } else if (id[0] === '.') {

        // 先相对与当前定义的模块定位。
        // 很可能多个 module 在一个文件里面定义的。
        if (modulename) {
            resolved = pth.join(pth.dirname(modulename), id);

            if (resolved && !conf.noOnymousModule && map.get(resolved)) {
                info = fis.uri(map.get(resolved), root);
            }
        }

        // 没找到，再来看当前文件夹下有没有这个文件。
        if (!info || !info.file) {
            // 相对路径
            info = fis.uri(id, dirname);
            info.file || (info = fis.uri(id + '.js', dirname));
        }

        // combine 模式
        // 看看当前文件里面已经有没有定义了的 module
        if (!info.file && !conf.noOnymousModule && (sibling = getKeyByValue(map.get(), file.subpath))) {
            id = pth.join(sibling.replace(/(\/|\\)[^\/\\]+$/, ''), id);

            if (id && map.get(id)) {
                info = fis.uri(map.get(id), root);
            }
        }

    } else if (id[0] === '/') {

        // 绝对路径, 那也是相对与 baseUrl 的绝对路径。
        id = id.substring(1);
        info = fis.uri(id, baseUrl);
        info.file || (info = fis.uri(id + '.js', baseUrl));

        // baseUrl 里面没有，还是再看看项目根目录里面有没有。
        if (!info.file) {
            info = fis.uri(id, root);
            info.file || (info = fis.uri(id + '.js', root));
        }

    } else if ((m = /^([^\/]+)(?:\/(.*))?$/.exec(id))) {
        path = m[0];
        pkg = m[1];
        subpath = m[2] || '';

        // 先查找 map 中是否已经注册
        // fixme 跨模块会不会有问题？
        if (!conf.noOnymousModule && map.get(path)) {
            info = fis.uri(map.get(path), root);
        } else if (paths[pkg]) {
            // 再查找 conf.paths
            dirs = paths[pkg];

            Array.isArray(dirs) || (dirs = [dirs]);

            for (i = 0, len = dirs.length; i < len; i++) {
                dir = dirs[i];

                // 如果是其他模块下的路径
                if (~dir.indexOf(connector)) {
                    return {
                        isFisId: true,
                        path: dir + subpath + (!subpath || /\.js$/.test(subpath)?'':'.js')
                    }
                }

                info = fis.uri(dir, baseUrl);
                info.file || (info = fis.uri(dir + '.js', baseUrl));

                if (!info.file) {
                    info = fis.uri(dir, root);
                    info.file || (info = fis.uri(dir + '.js', root));
                }

                if (info.file || !subpath) {
                    break;
                }

                // 没找到，再来当文件夹处理

                var dirorign = dir;

                if (dirorign[0] !== '/') {
                    dir = pth.join(baseUrl, dirorign);
                }

                info = fis.uri(subpath, dir);
                info.file || (info = fis.uri(subpath + '.js', dir));


                if (!info.file && dirorign[0] !== '/') {
                    dir = pth.join(baseUrl, dirorign);
                    info = fis.uri(subpath, dir);
                    info.file || (info = fis.uri(subpath + '.js', dir));
                }

                // 如果找到了需要断开。
                if (info.file) {
                    break;
                }
            }

        // 再查找 conf.packages
        } else if ((item = findPkg(pkg, pkgs))) {
            if (~item.location.indexOf(connector)) {

                subpath = subpath ? subpath : item.main || 'main';

                return {
                    isFisId: true,
                    path: item.location + '/' + subpath + (/\.js$/.exec(subpath) ? '' : '.js'),
                    pluginPath: pluginPath
                }
            }

            dir = baseUrl;
            dir = pth.join(dir, item.location || item.name);
            subpath = subpath || item.main || 'main';
            info = fis.uri(subpath, dir);
            info.file || (info = fis.uri(subpath + '.js', dir));

            if (!info.file) {
                dir = pth.join(root, item.location || item.name);
                info = fis.uri(subpath, dir);
                info.file || (info = fis.uri(subpath + '.js', dir));
            }
        } else {

            if (conf.shim) {
                var shim = conf.shim;

                for (var key in shim) {
                    if (!shim.hasOwnProperty(key)) {
                        continue;
                    }

                    var val = shim[key];
                    if (val.id === pkg ) {
                        info = fis.uri(key, root);
                        if (info.file) {
                            return {
                                file: info.file,
                                pluginPath: pluginPath
                            }
                        }
                    }
                }
            }

            var top = baseUrl;
            // 递归查找。
            for (dir = dirname; true;) {
                info = fis.uri(path, dir);
                info.file || (info = fis.uri(path + '.js', dir));

                if (info.file) {
                    break;
                }

                lastdir = dir;
                dir = pth.dirname(dir);

                if (dir === top || dir === lastdir) {
                    break;
                }
            }

            if (!info.file) {
                info = fis.uri(path, baseUrl);
                info.file || (info = fis.uri(path + '.js', baseUrl));
            }

            if (!info.file) {
                info = fis.uri(path, root);
                info.file || (info = fis.uri(path + '.js', root));
            }
        }
    }

    return {
        file: info && info.file,
        pluginPath: pluginPath
    }
}

function bulkReplace(content, arr) {
    arr
        .sort(function(a, b) {
            var diff = b.start - a.start;

            if (!diff) {
                a.weight = a.weight>>0;
                b.weight = b.weight>>0;

                if (a.weight !== b.weight) {
                    return b.weight - a.weight;
                }

                return b.len - a.len;
            }

            return diff;
        })
        .forEach(function(item) {
            content = strSplice(content, item.start, item.len, item.content);
        });

    return content;
}

// 只需把 html 中的 script 找出来，然后执行  parserJs。
parser.parseHtml = function(content, file, conf) {
    parser.scriptsReg.forEach(function(reg) {
        content = content.replace(reg, function(m, $1, $2) {
            var m2 = /\stype\s*=('|")(.*?)\1/i.exec($1);
            var type = m2 && m2[2].toLowerCase();

            if (type && !~['application/javascript', 'text/javascript'].indexOf(type)) {
                return m;
            }

            // in <script> tag
            if ($1) {
                m = $1 + parser.parseJs($2, file, conf);
            }

            return m;
        });
    });

    return content;
};

parser.parseJs = function(content, file, conf) {

    // 很可能是语法解析错误，不应该中断。
    try {
        content = _parseJs(content, file, conf);
    } catch (e) {
        fis.log.warning('Got Error: '+e.message+' while parse ['+file.subpath+']');
    }

    return content;
};

function _parseJs(content, file, conf) {
    var hasDefined = /(?:^|\s)define\s*\(/i.exec(content);
    var info;

    // 如果是 html 或者 vm 或者 tpl 如果压根就没有 amd 用法，那就跳过吧。
    if (!hasDefined && file.isHtmlLike && !/(?:^|\s)(require|require\.async)\s*\(/i.exec(content)) {
        return content;
    }

    // 能用正则检测出来，那就先用正则检测把，语法分析，耗时太长
    if (!hasDefined || (info = getInfo(content), !info.modules || !info.modules.length)) {

        if (conf.shim[file.subpath]) {
            content = wrapAMD(content, file, conf, conf.shim[file.subpath]);

            // 重新获取信息。
            info = getInfo(content);
        } else if (!file.isHtmlLike && (typeof file.useAMDWrap === 'undefined' ? (file.isMod || conf.wrapAll) : file.useAMDWrap)) {
            // 没找到 amd 定义, 则需要包装

            content = wrapAMD(content, file, conf);

            // 重新获取信息。
            info = getInfo(content);
        }
    }

    info = info || getInfo(content);

    // 先把所有自己指定了 id 的 module 跟文件路径关联起来。
    // 后面查找的时候有用。
    var affected = false;
    conf.noOnymousModule || travel(info, function(node) {
        var module = node.module;

        if (module && module.id) {
            if (map.get(module.id) !== file.subpath) {
                map.set(module.id, file.subpath);
                affected = true;
            }
        }
    });
    affected && map.save();

    // 开始一系列替换。
    var inserts = [];
    var converter = getConverter(content);

    var asyncRequires = [];
    var globalSyncRequires = [];

    travel(info, function(node, isRoot) {
        var module = node.module;

        // 处理模块定义中的替换。
        if (module && file.isMod !== false) {
            var argsRaw = [];   // factory 处理前的形参列表。
            var deps = [];  // 最终依赖列表
            var args = [];  // 最终 factory 的形参列表
            var moduleId, start, end, params;

            // 获取处理前的原始形参
            params = module.factory.params;
            params && params.forEach(function(param) {
                argsRaw.push(param.name);
            });

            // deps 是指 define 的第二个参数中指定的依赖列表。
            if (module.deps && module.deps.length) {

                // 添加依赖。
                module.deps.forEach(function(elem) {
                    var v = elem.raw;
                    var info = fis.util.stringQuote(v);
                    var target, moduleId, argname;

                    v = elem.value;

                    // 不需要查找依赖，如果是 require、module、或者 exports.
                    if (~'require,module,exports'.indexOf(v)) {
                        deps.push(elem.raw);
                        args.push(argsRaw.shift());
                        return;
                    }

                    target = resolveModuleId(v, file, conf, module.id);

                    if (target && target.file) {
                        file.addRequire(target.file.id);
                        compileFile(target.file);
                        moduleId = getModuleId(v, target.file, conf, module.id);

                        file.extras.paths[moduleId] = target.file.id;

                        deps.push(info.quote + moduleId + (target.pluginPath ? '!' + target.pluginPath : '') + info.quote);
                        argname = argsRaw.shift();
                        argname && args.push(argname);
                    } else if (target && target.isFisId) {
                        file.addRequire(target.path);
                        moduleId = target.path.replace(/\.js$/, '');
                        file.extras.paths[moduleId] = target.path;

                        deps.push(info.quote + moduleId + (target.pluginPath ? '!' + target.pluginPath : '') + info.quote);
                        argname = argsRaw.shift();
                        argname && args.push(argname);
                    } else {

                        deps.push(elem.raw);
                        argname = argsRaw.shift();
                        argname && args.push(argname);

                        fis.log.warning('Can not find module `' + v + '` in [' + file.subpath + ']');
                    }
                });
            }
            //  没有指定的话，原来 factory 里面参数放回去。
            else {
                args = argsRaw.concat();
            }

            // module 中的 require(string) 列表。
            if (node.requires && node.requires.length) {
                node.requires.forEach(function(item) {

                    if (item.isLocal && item.isLocal.defs[0].name !== module.factory.params[0]) {
                        return;
                    }

                    var elem = item.node.arguments[0];
                    var v = elem.value;
                    var info = fis.util.stringQuote(elem.raw);
                    var target, moduleId, val, start, end;

                    target = resolveModuleId(v, file, conf, module.id);

                    if (target && target.file) {
                        file.removeRequire(v);
                        file.addRequire(target.file.id);
                        compileFile(target.file);
                        moduleId = getModuleId(v, target.file, conf, module.id );
                        file.extras.paths[moduleId] = target.file.id;

                        start = converter(elem.loc.start.line, elem.loc.start.column);
                        inserts.push({
                            start: start,
                            len: elem.raw.length,
                            content: info.quote + moduleId + (target.pluginPath ? '!' + target.pluginPath : '') + info.quote
                        });

                        // 非依赖前置
                        if (!conf.forwardDeclaration) {
                            return;
                        }
                    } else if (target && target.isFisId) {
                        file.removeRequire(v);
                        file.addRequire(target.path);
                        moduleId = target.path.replace(/\.js$/, '');
                        file.extras.paths[moduleId] = target.path;

                        start = converter(elem.loc.start.line, elem.loc.start.column);
                        inserts.push({
                            start: start,
                            len: elem.raw.length,
                            content: info.quote + moduleId + (target.pluginPath ? '!' + target.pluginPath : '') + info.quote
                        });

                        // 非依赖前置
                        if (!conf.forwardDeclaration) {
                            return;
                        }
                    } else {
                        fis.log.warning('Can not find module `' + v + '` in [' + file.subpath + ']');
                        deps.push(info.quote + v + info.quote);
                        return;
                    }

                    deps.push(info.quote + moduleId + (target.pluginPath ? '!' + target.pluginPath : '') + info.quote);
                });

                if (conf.forwardDeclaration) {

                    if (!args.length) {
                        args.push('require');
                    }

                    if (args[0] === 'require' && deps[0] !== '\'require\'' && deps[0] !== '\"require\"') {
                        deps.unshift('\'require\'');
                    }

                    if (args[1] === 'exports' && deps[1] !== '\'exports\'' && deps[1] !== '\"exports\"') {
                        deps.splice(1, 0, '\'exports\'');
                    }

                    if (args[2] === 'module' && deps[2] !== '\'module\'' && deps[2] !== '\"module\"') {
                        deps.splice(2, 0, '\'module\'');
                    }
                }
            }

            // 替换 factory args.
            if (args.length && params) {
                if (params.length) {
                    start = converter(params[0].loc.start.line, params[0].loc.start.column);
                    end = converter(params[params.length - 1].loc.end.line, params[params.length - 1].loc.end.column);
                } else {
                    start = converter(module.factory.loc.start.line, module.factory.loc.start.column);
                    end = converter(module.factory.loc.end.line, module.factory.loc.end.column);
                    start += /^function[^\(]*\(/i.exec(content.substring(start, end))[0].length;
                    end = start;
                }

                inserts.push({
                    start: start,
                    len: end - start,
                    content: args.join(', ')
                });
            }

            // 替换 deps
            if (deps.length) {
                start = converter(module.depsLoc.start.line, module.depsLoc.start.column);
                end = converter(module.depsLoc.end.line, module.depsLoc.end.column);

                deps = deps.filter(function(elem, pos, thearr) {
                    return args[pos] || thearr.indexOf(elem) === pos;
                });

                inserts.push({
                    start: start,
                    len: end - start,
                    content: '[' + deps.join(', ') + ']' + (module.deps ? '' : ',')
                });
            }

            // 添加 module id
            if (!module.id || conf.noOnymousModule) {

                if (file._anonymousDefineCount) {
                    throw new Error('The file has more than one anonymous ' +
                            'define');
                    return;
                }

                var originId = module.id;
                module.id = moduleId = getModuleId('', file, conf);
                file.extras.moduleId = file.extras.moduleId || moduleId;

                if (module.idLoc) {
                    start = module.idLoc.start;
                    inserts.push({
                        start: converter(start.line, start.column),
                        len: originId.length + 2,
                        content: '\'' + moduleId + '\'',
                        weight: -5
                    });
                } else {
                    start = module.node.loc.start;
                    start = converter(start.line, start.column);
                    start += /^define\s*\(/.exec(content.substring(start))[0].length;

                    inserts.push({
                        start: start,
                        len: 0,
                        content: '\''+moduleId+'\', ',
                        weight: -5
                    });
                }

                file._anonymousDefineCount = file._anonymousDefineCount || 0;
                file._anonymousDefineCount++;
            } else {
                // 署名模块
                //
                file.extras.moduleId = module.id;
            }

            if (node.asyncRequires && node.asyncRequires.length) {
                node.asyncRequires.forEach(function(req) {
                    req.markAsync = true;
                    asyncRequires.push(req);
                });
            }
        }

        // 处理全局 require 和 require.async
        else {
            if (node.asyncRequires && node.asyncRequires.length) {
                [].push.apply(asyncRequires, node.asyncRequires);
            }

            if (node.requires && node.requires) {
                node.requires.forEach(function(req) {
                    if (!req.isLocal) {
                        globalSyncRequires.push(req);
                    }
                });
            }
        }
    });

    asyncRequires.forEach(function(req) {
        // 只有在模块中的异步才被认为是异步？
        // 因为在 define 外面，没有这样的用法： var lib = require('string');
        // 所以不存在同步用法，也就无法把同步依赖提前加载进来。
        // 为了实现提前加载依赖来提高性能，我们把global下的异步依赖认为是同步的。
        //
        // 当然这里有个总开关，可以通过设置 `globalAsyncAsSync` 为 false 来关闭此功能。
        // 另外可以在 require 异步用法的语句前面加上 require async 的注释来，标记异步。
        var async = conf.globalAsyncAsSync ? req.markAsync : !req.markSync;

        (req.deps || []).forEach(function(elem) {
            var v = elem.raw;
            var info = fis.util.stringQuote(v);
            var target, start, moduleId;

            v = info.rest.trim();
            target = resolveModuleId(v, file, conf, elem.id);

            if (target && target.file) {
                compileFile(target.file);
                moduleId = getModuleId(v, target.file, conf, elem.id);

                if (async) {
                    if (!~file.extras.async.indexOf(target.file.id) && !~file.requires.indexOf(target.file.id)) {
                        file.extras.async.push(target.file.id);
                    }
                } else {
                    file.addRequire(target.file.id);
                }

                file.extras.paths[moduleId] = target.file.id;

                start = elem.loc.start;
                start = converter(start.line, start.column);

                inserts.push({
                    start: start,
                    len: elem.raw.length,
                    content: info.quote + moduleId + (target.pluginPath ? '!' + target.pluginPath : '') + info.quote
                });

            } else if (target && target.isFisId) {
                moduleId = target.path.replace(/\.js/, '');

                if (async) {
                    if (!~file.extras.async.indexOf(target.path) && !~file.requires.indexOf(target.path)) {
                        file.extras.async.push(target.path);
                    }
                } else {
                    file.addRequire(target.path);
                }

                file.extras.paths[moduleId] = target.path;

                start = elem.loc.start;
                start = converter(start.line, start.column);

                inserts.push({
                    start: start,
                    len: elem.raw.length,
                    content: info.quote + moduleId + (target.pluginPath ? '!' + target.pluginPath : '') + info.quote
                });
            } else {
                fis.log.warning('Can not find module `' + v + '` in [' + file.subpath + ']');
            }
        });
    });

    // 兼容老用法。
    globalSyncRequires.forEach(function(item) {
        var elem = item.node.arguments[0];
        var v = elem.value;
        var info = fis.util.stringQuote(elem.raw);
        var target, moduleId, val, start, end;

        target = resolveModuleId(v, file, conf);

        if (target && target.file) {
            file.removeRequire(v);
            file.addRequire(target.file.id);
            compileFile(target.file);
            moduleId = getModuleId(v, target.file, conf);
            file.extras.paths[moduleId] = target.file.id;

            start = converter(elem.loc.start.line, elem.loc.start.column);
            inserts.push({
                start: start,
                len: elem.raw.length,
                content: info.quote + moduleId + (target.pluginPath ? '!' + target.pluginPath : '') + info.quote
            });
        } else if (target && target.isFisId) {
            file.removeRequire(v);
            file.addRequire(target.path);
            moduleId = target.path.replace(/\.js/, '');
            file.extras.paths[moduleId] = target.path;

            start = converter(elem.loc.start.line, elem.loc.start.column);
            inserts.push({
                start: start,
                len: elem.raw.length,
                content: info.quote + moduleId + (target.pluginPath ? '!' + target.pluginPath : '') + info.quote
            });
        } else {
            fis.log.warning('Can not find module `' + v + '` in [' + file.subpath + ']');
        }
    });

    content = bulkReplace(content, inserts);

    // 兼容性替换
    content = content.replace(/\brequire\.async\s*\(\s*('|")(.*?)\1/, 'require([$1$2$1]');
    content = content.replace(/\brequire\.async\s*\(\s*\[/, 'require([');

    return content;
}

function travel(info, visitor, child) {
    visitor(info, !child);

    if (info.modules && info.modules) {
        info.modules.forEach(function(node) {
            travel(node, visitor, true);
        });
    }
}
