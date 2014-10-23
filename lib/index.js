var esprima = require('esprima');
var estraverse = require('estraverse');
var escope = require('escope');

// this module is highly inspired by https://github.com/villadora/amd-parser
//

exports.getInfo = function(content) {
    var ast = esprima.parse(content, {
        loc: true,
        comment: true,
        range: true,
        tokens: true
    });

    var scopes = escope.analyze(ast).scopes;
    var gs = scopes.filter(function(scope) {
        return scope.type == 'global';
    })[0];

    var modules, asyncRequires, globalSyncRequires;
    return {
        getModules: function() {
            modules = modules || _getAMDModules(ast, scopes, gs);
        },

        getAsyncRequires: function() {
            asyncRequires = asyncRequires || _getAsyncRequires(ast, scopes, gs);
        },

        getGlobalSyncRequires: function() {
            globalSyncRequires = globalSyncRequires || _getGlobalSyncRequires(ast, scopes, gs);
        }
    }

};

// 获取 amd 模块
exports.getAMDModules = function getAMDModules(content) {
    var ast = esprima.parse(content, {
        loc: true
    });
    var scopes = escope.analyze(ast).scopes;
    var gs = scopes.filter(function(scope) {
        return scope.type == 'global';
    })[0];

    return _getAMDModules(ast, scopes, gs);
};

function _getAMDModules(ast, scopes, gs) {
    var modules = [];

    estraverse.traverse(ast, {

        enter: function(current, parent) {
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

                var module = {};
                var args = current.arguments;

                module.node = current;

                var idx = 0;

                if (args[idx].type == 'Literal') {
                    module.id = args[idx].value;
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

                    module.deps = deps;
                    module.depsLoc = args[idx].loc;
                } else {
                    var loc = args[idx].loc.start;

                    module.depsLoc = {
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

                module.factory = factory;

                if (factory.type === 'FunctionExpression' || factory.type === 'FunctionDeclaration') {
                    module.syncRequires = getSyncRequires(factory.body);
                }

                modules.push(module);
            }
        }
    });

    return modules;
}

exports.getAsyncRequires = function getAsyncRequires(content) {
    var ast = esprima.parse(content, {
        loc: true,
        comment: true,
        range: true,
        tokens: true
    });
    var scopes = escope.analyze(ast).scopes;
    var gs = scopes.filter(function(scope) {
        return scope.type == 'global';
    })[0];

    return _getAsyncRequires(ast, scopes, gs);
};


function _getAsyncRequires(ast, scopes, gs) {
    var ret = [];

    ast = estraverse.attachComments(ast, ast.comments, ast.tokens);

    estraverse.traverse(ast, {

        enter: function(current, parent) {

            // 判断是否是 require(xxx, callback);
            // 后者是 require.async(xxx, callback);
            if (current.type === 'CallExpression' &&

                    (
                        current.callee.type === 'Identifier' &&
                            current.callee.name === 'require' ||

                        current.callee.type === 'MemberExpression' &&
                            current.callee.object.name === 'require' &&
                            current.callee.property.name === 'async'
                    ) &&

                    current.arguments[0].type === 'ArrayExpression'
                ) {

                var module = {};
                var args = current.arguments;

                module.node = current;

                var deps = null;
                if (args[0].type === 'ArrayExpression') {
                    deps = args[0].elements.filter(function(elm) {

                        if (elm.type !== 'Literal') {
                            fis.log.warning('WARN: not a standard require method.');
                            return false;
                        }

                        return true;
                    });
                }

                module.deps = deps;

                // 判断require async 是否在 global 中。
                // 是 global，则认为是入口，则同步加载。
                // 只有模块中的异步才是真正的异步。
                var leavelist = this.__leavelist;
                var i = leavelist.length;
                var item, node, ref, comments = [];

                module.isInModule = false;
                while ((item = leavelist[--i])) {
                    node = item.node;

                    if (node && node.leadingComments) {
                        comments.push.apply(comments, node.leadingComments);
                    }

                    if (node &&
                            node.type === 'CallExpression' &&
                            node.callee.type === 'Identifier' &&
                            node.callee.name === 'define' &&

                            (
                                node.arguments.length == 1 && node.arguments[0].type === 'ObjectExpression' ||
                                node.arguments[node.arguments.length - 1].type === 'FunctionExpression' ||
                                node.arguments[node.arguments.length - 1].type === 'FunctionDeclaration'
                            )

                        ) {
                            // 查找 define 的定义，如果没有定义，说明是全局的。
                            // 否则说明是局部 define.
                            ref = findRef(gs, node.callee);

                            // 如果非局部 define 则忽略。
                            if (!ref.resolved) {
                                module.isInModule = true;
                                break;
                            }
                        }
                }

                comments.forEach(function(comment) {
                    if (/fis\s+async/i.exec(comment.value)) {
                        module.markAsync = true;
                    }
                });

                ret.push(module);
            }
        }
    });

    return ret;
}

exports.getGlobalSyncRequires = function getGlobalSyncRequires(content) {
    var ast = esprima.parse(content, {
        loc: true
    });
    var scopes = escope.analyze(ast).scopes;
    var gs = scopes.filter(function(scope) {
        return scope.type == 'global';
    })[0];

    return _getGlobalSyncRequires(ast, scopes, gs);
};

function _getGlobalSyncRequires(ast, scopes, gs) {
    var ret = [];

    estraverse.traverse(ast, {

        enter: function(current, parent) {

            if (current.type === 'CallExpression' &&

                    current.callee.type === 'Identifier' &&
                    current.callee.name === 'require' &&

                    current.arguments.length == 1 &&

                    current.arguments[0].type === 'Literal'
                ) {

                var module = {};
                module.node = current;

                // 判断require async 是否在 global 中。
                // 是 global，则认为是入口，则同步加载。
                // 只有模块中的异步才是真正的异步。
                var leavelist = this.__leavelist;
                var i = leavelist.length;
                var item, node, ref;

                module.isInModule = false;
                while ((item = leavelist[--i])) {
                    node = item.node;

                    if (node &&
                            node.type === 'CallExpression' &&
                            node.callee.type === 'Identifier' &&
                            node.callee.name === 'define' &&

                            (
                                node.arguments.length == 1 && node.arguments[0].type === 'ObjectExpression' ||
                                node.arguments[node.arguments.length - 1].type === 'FunctionExpression' ||
                                node.arguments[node.arguments.length - 1].type === 'FunctionDeclaration'
                            )

                        ) {
                            // 查找 define 的定义，如果没有定义，说明是全局的。
                            // 否则说明是局部 define.
                            ref = findRef(gs, node.callee);

                            // 如果非局部 define 则忽略。
                            if (!ref.resolved) {
                                module.isInModule = true;
                                break;
                            }
                        }
                }

                module.isInModule || ret.push(module);
            }
        }
    });

    return ret;
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

// 获取 factory 中同步依赖。
function getSyncRequires(ast) {
    var ret = [];

    estraverse.traverse(ast, {

        enter: function(current, parent) {
            if (current.type === 'CallExpression' &&

                    current.callee.type === 'Identifier' &&
                    current.callee.name === 'require' &&

                    current.arguments.length == 1 &&

                    current.arguments[0].type === 'Literal'
                ) {

                var def = {};

                def.node = current;

                def.parent = parent;

                ret.push(def);
            }
        }
    });

    return ret;
}