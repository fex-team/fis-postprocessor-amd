var esprima = require('esprima');
var estraverse = require('estraverse');
var escope = require('escope');

module.exports = function(content, options) {
    var ast = esprima.parse(content, {
        loc: true,
        attachComment: true,
        range: true,
        tokens: true
    });

    var scopes = escope.analyze(ast).scopes;
    var gs = scopes.filter(function(scope) {
        return scope.type == 'global';
    })[0];

    var global = {};
    var stack = [global];

    traverse(ast, scopes, gs, function(type, info) {
        var parent = stack[stack.length - 1];

        if (type === 'define') {
            var container = {
                module: info
            };

            parent.modules = parent.modules || [];
            parent.modules.push(container);
            stack.push(container);
        } else if (type === 'require') {
            parent.requires = parent.requires || [];
            parent.requires.push(info);
        } else if (type === 'asyncRequire') {
            parent.asyncRequires = parent.asyncRequires || [];
            parent.asyncRequires.push(info);
        }

    }, function(type, info) {
        if (type === 'define') {
            stack.pop();
        }
    });

    return global;
};

function traverse(ast, scopes, gs, enter, leave) {
    estraverse.traverse(ast, {
        enter: function(current, parent) {

            // 检测 define(id?, deps?, factory);
            if (current.type === 'CallExpression' &&
                    current.callee.type === 'Identifier' &&
                    current.callee.name === 'define' &&

                    (
                        current.arguments[current.arguments.length - 1].type === 'ObjectExpression' ||
                        current.arguments[current.arguments.length - 1].type === 'FunctionExpression' ||
                        current.arguments[current.arguments.length - 1].type === 'FunctionDeclaration' ||
                        current.arguments[current.arguments.length - 1].type === 'Identifier'
                    )
                ) {

                // 查找 define 的定义，如果没有定义，说明是全局的。
                // 否则说明是局部 define.
                var ref = findRef(gs, current.callee);

                // 如果是局部 define 则忽略。
                if (ref.resolved) {
                    return;
                }

                var info = {};
                var args = current.arguments;

                info.node = current;

                var idx = 0;

                if (args[idx].type == 'Literal') {
                    info.id = args[idx].value;
                    info.idLoc = args[idx].loc;
                    idx++;
                }

                var deps = null;
                if (args[idx].type == 'ArrayExpression') {
                    deps = args[idx].elements.filter(function(elm) {

                        if (elm.type !== 'Literal') {
                            fis.log.warning('WARN: not a standard define method.');
                            return false;
                        }

                        return true;
                    });

                    info.deps = deps;
                    info.depsLoc = args[idx].loc;
                } else {
                    var loc = args[idx].loc.start;

                    info.depsLoc = {
                        start: {
                            line: loc.line,
                            column: loc.column
                        },
                        end: {
                            line: loc.line,
                            column: loc.column
                        }
                    }
                }

                var factory = current.arguments[current.arguments.length - 1];

                info.factory = factory;
                current.isDefine = true;
                current.info = info;

                enter('define', info);
            } else

            // 检查 require('xxxx')
            if (current.type === 'CallExpression' &&

                    current.callee.type === 'Identifier' &&
                    current.callee.name === 'require' &&

                    current.arguments.length == 1 &&

                    current.arguments[0].type === 'Literal') {

                var info = {};
                info.node = current;

                // 查找 require 的定义
                var ref = findRef(gs, current.callee);
                info.isLocal = ref.resolved;

                current.isRequire = true;
                current.info = info;
                enter('require', info);
            } else

            // 检查 require([xxx, xxx?], callback?);
            if (current.type === 'CallExpression' &&

                    current.callee.type === 'Identifier' &&
                    current.callee.name === 'require' &&

                    current.arguments[0].type === 'ArrayExpression') {

                var info = {};
                var args = current.arguments;

                info.node = current;

                var deps = null;
                deps = args[0].elements.filter(function(elm) {

                    if (elm.type !== 'Literal') {
                        fis.log.warning('WARN: not a standard require method.');
                        return false;
                    }

                    return true;
                });

                info.deps = deps;

                // 判断是否存在手动标记为异步的注释块。
                var leavelist = this.__leavelist;
                var i = leavelist.length;
                var item, node, comments = [], _comments;

                while ((item = leavelist[--i])) {
                    node = item.node;
                    _comments = node && node.leadingComments;

                    if (_comments) {
                        comments.push.apply(comments, _comments);
                    }
                }

                comments.forEach(function(comment) {
                    if (/fis\s+async/i.exec(comment.value)) {
                        info.markAsync = true;
                    } else if (/fis\s+sync/i.exec(comment.value)) {
                        info.markSync = true;
                    }
                });

                // 查找 require 的定义
                var ref = findRef(gs, current.callee);
                info.isLocal = ref.resolved;

                current.isAsyncRequire = true;
                current.info = info;

                enter('asyncRequire', info);
            } else

            // 老版本使用兼容:
            // require.async(xxx, callback?);
            // require.async([xxxx, xxx?], callback?)
            if (current.type === 'CallExpression' &&

                    current.callee.type === 'MemberExpression' &&
                    current.callee.object.name === 'require' &&
                    current.callee.property.name === 'async' &&

                    (
                        current.arguments[0].type === 'ArrayExpression' ||
                        current.arguments[0].type === 'Literal'
                    )
                ) {

                var info = {};
                var args = current.arguments;

                info.node = current;

                var deps = null;

                if (args[0].type === 'ArrayExpression') {
                    deps = args[0].elements.filter(function(elm) {

                        if (elm.type !== 'Literal') {
                            fis.log.warning('WARN: not a standard require method.');
                            return false;
                        }

                        return true;
                    });
                } else if (args[0].type === 'Literal') {
                    deps = [
                        args[0]
                    ];
                }

                info.deps = deps;

                current.isAsyncRequire = true;
                current.info = info;

                enter('asyncRequire', info);
            }
        },

        leave: function(current, parent) {
            if (current.isDefine) {
                leave('define', current.info);
            } else if (current.isRequire) {
                leave('require', current.info);
            } else if (current.isAsyncRequire) {
                leave('asyncRequire', current.info);
            }
        }
    });
}

function findRef(scope, ident) {
    var refs = scope.references;
    var i = 0;
    var ref, childScope;

    while ((ref = refs[ i++ ])) {

        if (ref.identifier === ident) {
            return ref;
        }
    }

    i = 0;

    while ((childScope = scope.childScopes[ i++ ])) {

        if ((ref = findRef(childScope, ident))) {
            return ref;
        }
    }
}
