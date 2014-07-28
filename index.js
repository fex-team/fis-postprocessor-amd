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
var lib = require('./lib/');

var parser = module.exports = function(content, file, conf) {
    
    // 左分隔符
    var ld = conf.left_delimiter ||
            fis.config.get('settings.template.left_delimiter') || '{%';

    // 右分隔符
    var rd = conf.right_delimiter ||
            fis.config.get('settings.template.right_delimiter') || '%}';

    // 正则特殊字符转义
    ld = pregQuote(ld);
    rd = pregQuote(rd);

    var reg;

    // smarty script tag
    reg = new RegExp('('+ld+'script(?:\\s+[\\s\\S]*?["\'\\s\\w\\/]'+rd+'|\\s*'+rd+'))([\\s\\S]*?)(?='+ld+'\\/script'+rd+'|$)', 'ig');
    parser.scriptsReg.push(reg);


    // swig script tag
    reg = new RegExp('('+ld+'\\s*script\\s+[\\s\\S]*?\\s*' +
            rd + ')([\\s\\S]*?)(?=' + ld + '\\s*endscript\\s*' +
            rd + '|$)', 'ig');

    parser.scriptsReg.push(reg);

    // 其他标签，请通过 exports.scriptsReg 扩展。


    // 读取用户自定义脚本正则。
    if (conf.scriptsReg) {
        if (Array.isArray(conf.scriptsReg)) {
            parser.scriptsReg.push.apply(parser.scriptsReg, conf.scriptsReg);
        } else {
            parser.scriptsReg.push(conf.scriptsReg);
        }
    }


    file.extras = file.extras || {};
    file.extras.async = [];
    file.extras.alias = {};

    if (file.isHtmlLike) {
        content = parser.parseHtml(content, file, conf);
    } else if (file.rExt === '.js') {
        content = parser.parseJs(content, file, conf);
    }

    // 减少 map.json 体积
    file.extras.async.length || (delete file.extras.async);
    isEmptyObject(file.extras.alias) && (delete file.extras.alias);
    isEmptyObject(file.extras) && (delete file.extras);

    return content;
};

parser.parseHtml = function(content, file, conf) {
    parser.scriptsReg.forEach(function(reg) {
        content = content.replace(reg, function(m, $1, $2) {
            
            // in <script> tag
            if ($1) {
                m = $1 + parser.parseJs($2, file, conf);
            }

            return m;
        });
    });

    return content;
};

parser.defaultOptions = {
    forwardDeclaration: true
};

// 将正则特殊字符转义。
function pregQuote (str, delimiter) {
    return (str + '').replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + (delimiter || '') + '-]', 'g'), '\\$&');
}

parser.scriptsReg = [
    /(<script(?:\s+[\s\S]*?["'\s\w\/]>|\s*>))([\s\S]*?)(?=<\/script>|$)/ig
];

// like array.splice
function strSplice(str, index, count, add) {
    return str.slice(0, index) + add + str.slice(index + count);
}

// 查找 module id.
function resolveModuleId(id, dirname, conf) {
    var alias = conf.alias || {};
    var info;

    if (!/\.js$/i.test(id) && /^(\.|\/)/.test(id)) {
        id += '.js';
    }

    info = fis.uri(id, dirname);

    if (info.file) {
        return info;
    } else if (alias[id]) {
        info = fis.uri(alias[id], fis.project.getProjectPath());
        info.isAlias = !!info.file;
        return info;
    }
}


parser.parseJs = function(content, file, conf) {
    var modules = lib.getAMDModules(content);
    var suffix = '';
    var anonymousDefineCount = 0;
    var diff, converter, requires;

    // 没找到 amd 定义, 则需要包装
    if (!modules.length && (file.isMod || conf.wrapAll)) {
        content = wrapAMD(content, file, conf);
        modules = lib.getAMDModules(content);
    }

    converter = getConverter(content);
    diff = 0;
    
    // 编译所有模块定义列表
    modules.forEach(function(module) {
        var argsRaw = [];
        var deps = [];
        var args = [];
        var moduleId, start, end, params;
        
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
                var target, moduleId;

                v = elem.value;

                // 不需要查找依赖，如果是 require、module、或者 exports.
                if (~'require,module,exports'.indexOf(v)) {
                    deps.push(elem.raw);
                    args.push(argsRaw.shift());
                    return;
                }

                target = resolveModuleId(v, file.dirname, conf);

                if (target && target.file) {
                    fis.compile(target.file);
                    file.addRequire(target.file.id);
                    moduleId = target.isAlias ? v :
                            target.file.moduleId || target.file.id;

                    deps.push(info.quote + moduleId + info.quote);
                    args.push(argsRaw.shift());
                } else {
                    fis.log.warning('Can not find module `' + v + '`');
                }
            });
        } else {
            args = argsRaw.concat();
        }

        // module 中的 require(string) 列表。
        if (module.syncRequires && module.syncRequires.length) {

            module.syncRequires.forEach(function(item) {
                var elem = item.node.arguments[0];
                var v = elem.value;
                var info = fis.util.stringQuote(elem.raw);
                var target, moduleId, val, start, end;

                // alreay resolved
                if (/^\w+:/.test(v)) {
                    moduleId = v;
                } else {
                    target = resolveModuleId(v, file.dirname, conf);

                    if (target && target.file) {
                        fis.compile(target.file);
                        file.addRequire(target.file.id);
                        moduleId = target.isAlias ? v :
                                target.file.moduleId || target.file.id;

                        start = converter(elem.loc.start.line, elem.loc.start.column);
                        content = strSplice(content, start, elem.raw.length, info.quote + moduleId + info.quote);

                        // 非依赖前置
                        if (!conf.forwardDeclaration) {
                            return;
                        }
                    } else {
                        fis.log.warning('Can not find module `' + v + '`');
                    }
                }

                deps.push(info.quote + moduleId + info.quote);
            });

            // define(function(require) {
            //      var a = require('a');
            //      var b = require('b');
            // });
            // 
            // define(['require', 'exports', 'module'], function(require, exports) {
            //      var a = require('a');
            //      var b = require('b');
            // });
            // 
            if (conf.forwardDeclaration) {

                if (!args.length) {
                    args.push('require');
                }

                if (args[0] === 'require' && deps[0].substring(1, 8) !== 'require') {
                    deps.unshift('\'require\'');
                }

                if (args[1] === 'exports' && deps[1].substring(1, 8) !== 'exports') {
                    deps.splice(1, 0, '\'exports\'');
                }

                if (args[2] === 'module' && deps[2].substring(1, 7) !== 'module') {
                    deps.splice(2, 0, '\'module\'');
                }
            }
        }
        

        // 替换 factory args.
        if (args.length) {
            if (params.length) {
                start = converter(params[0].loc.start.line, params[0].loc.start.column);
                end = converter(params[params.length - 1].loc.end.line, params[params.length - 1].loc.end.column);
            } else {
                start = converter(module.factory.loc.start.line, module.factory.loc.start.column);
                end = converter(module.factory.loc.end.line, module.factory.loc.end.column);
                start += /^function[^\(]*\(/i.exec(content.substring(start, end))[0].length;
                end = start;
            }

            content = strSplice(content, start, end - start, args.join(', '));
        }

        // 替换 deps
        if (deps.length) {
            start = converter(module.depsLoc.start.line, module.depsLoc.start.column);
            end = converter(module.depsLoc.end.line, module.depsLoc.end.column);

            content = strSplice(content, start, end - start, '[' + deps.join(', ') + ']' + (module.deps ? '' : ','))
        }

        // 添加 module id
        if (!module.id) {
            
            if (anonymousDefineCount) {
                fis.log.error('The file has more than one anonymous ' +
                        'define');
                return;
            }

            moduleId = file.moduleId || file.id;
            start = module.node.loc.start;
            start = converter(start.line, start.column);
            start += /^define\s*\(/.exec(content.substring(start))[0].length;
            content = strSplice(content, start, 0, '\''+moduleId+'\', ');
            anonymousDefineCount++;
        } else {
            conf.alias = conf.alias || {};
            conf.alias[module.id] = conf.alias[module.id] || file.subpath;
        }
    });


    requires = lib.getAsyncRequires(content);

    if (requires.length) {
        converter = getConverter(content);

        diff = 0;
        requires.forEach(function(req) {

            // 只有在模块中的异步才被认为是异步？
            // 这块逻辑待商定！！！！！
            var async = req.isInModule;

            (req.deps || []).forEach(function(elem) {
                var v = elem.raw;
                var info = fis.util.stringQuote(v);
                var target, start, moduleId;

                v = info.rest.trim();
                target = resolveModuleId(v, file.dirname, conf);

                if (target && target.file) {
                    fis.compile(target.file);

                    if (async) {
                        if (!~file.extras.async.indexOf(target.file.id)) {
                            file.extras.async.push(target.file.id);
                            file.extras.alias[v] = target.file.id;
                        }
                    } else {
                        file.addRequire(target.file.id);
                    }

                    moduleId = target.file.moduleId || target.file.id;

                    if (!target.isAlias) {
                        
                        start = elem.loc.start;
                        start = converter(start.line, start.column) + diff;

                        diff += moduleId.length - elem.value.length;
                        content = strSplice(content, start, elem.raw.length, info.quote + moduleId + info.quote);
                    } else if (async) {
                        // suffix += '\n' + 'require.config({paths: {' +
                        //         '"' + v + '": "' + moduleId + '"' +
                        //     '}});';
                    }
                } else {
                    fis.log.warning('Can not find module `' + v + '`');
                }
            });

        });
    }

    return content + suffix;
};

var getConverter = function(content) {
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

function wrapAMD(content, file, conf) {
    var moduleId = file.moduleId || file.id;

    content = 'define(\'' + moduleId + '\', function() {\n' + content + '\n});';

    return content;
}

function isEmptyObject(obj) {

    for (var key in obj) {
        return false;
    }

    return true;
}
