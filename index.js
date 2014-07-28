/**
 * @fileOverview 解析 js 中 amd 依赖。
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


    var initial = false;

    if (file.extras == undefined) {
        file.extras = {};
        initial = true;
    }

    file.extras.async = [];
    file.extras.alias = {};

    if (file.isHtmlLike) {
        content = parser.parseHtml(content, file, conf);
    } else if (file.rExt === '.js') {
        content = parser.parseJs(content, file, conf);
    }

    // 如果为空，且 file.extras 数组是我加的，则把它 delete 掉。
    if (file.extras.async.length == 0) {
        delete file.extras.async;
        delete file.extras.alias;
        
        if (initial) {
            delete file.extras;
        }
    }

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
    var diff, converter, requires;

    // 没找到 amd 定义, 则需要包装
    if (!modules.length && (file.isMod || conf.wrapAll)) {
        content = wrapAMD(content, file, conf);
        modules = lib.getAMDModules(content);
    }

    converter = getConverter(content);
    diff = 0;
    
    modules.forEach(function(module) {
        var argsRaw = [];
        var deps = [];
        var args = [];
        var moduleId, start, end, params;
        
        params = module.factory.params;
        params.forEach(function(param) {
            argsRaw.push(param.name);
        });

        // 添加依赖。
        (module.deps || []).forEach(function(elem) {
            var v = elem.raw;
            var info = fis.util.stringQuote(v);
            var target, moduleId;

            v = elem.value;

            if (~'require,module,exports'.indexOf(v)) {
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

        (module.syncRequires || []).forEach(function(item) {
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

                    // 非依赖前置
                    if (!conf.forwardDeclaration) {
                        start = converter(elem.loc.start.line, elem.loc.start.column);
                        content = strSplice(content, start, elem.raw.length, info.quote + moduleId + info.quote);
                        return;
                    }
                } else {
                    fis.log.warning('Can not find module `' + v + '`');
                }
            }

            val = item.parent.id.name;
            deps.push(info.quote + moduleId + info.quote);
            args.push(val);

            // 去掉 require 代码。
            start = converter(item.parent.loc.start.line, item.parent.loc.start.column);
            end = converter(item.parent.loc.end.line, item.parent.loc.end.column);

            if (content.substring(end, end + 1) === ';') {
                var m = /(var|,)\s*$/.exec(content.substring(0, start));
                end += m[1] === 'var' ? 1 : 0;
                start -= m[0].length;
            } else if (content.substring(end, end + 1) === ',') {
                end += 1;
            }
            content  = strSplice(content, start, end - start, '');
        });

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
            moduleId = file.moduleId || file.id;
            start = module.node.loc.start;
            start = converter(start.line, start.column);
            content = strSplice(content, start + 'define('.length, 0, '\''+moduleId+'\', ');
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
