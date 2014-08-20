var packager = module.exports = function(ret, conf, settings, opt) {
    
    //walk
    fis.util.map(ret.src, function(subpath, file){
        if (file.extras && (file.extras.paths || file.extras.asyncPaths)) {
            genMapFile(file, ret, opt);
        }
    });

};

function genMapFile(file, ret, opt) {
    var paths = getPaths(file, ret, true);
    var map = {};
    var moduleMap = {};
    var isEmpty = true;

    Object.keys(paths).forEach(function(moduleId) {
        var id = paths[moduleId];
        var file = ret.ids[id];
        var url;

        if (!file) {
            return;
        }

        moduleMap[moduleId] = file.getId();
        isEmpty = false;

        if ((url = file.getUrl(opt.hash, opt.domain)) !== moduleId) {
            map[moduleId] = url.replace(/\.js$/i, '');
        }
    });

    if (!isEmpty) {
        var subpath = file.subpathNoExt + '-async-map.js';
        var code = 'require.config({"paths":' + JSON.stringify(map, null, opt.optimize ? null : 4) + '});';

        // 构造map.js配置文件
        var mapFile = fis.file(fis.project.getProjectPath(), subpath);
        
        // 放内容是为了能区分 md5
        mapFile.setContent(code);
        mapFile.isAsyncMap = true;
        mapFile.moduleMap = moduleMap;

        ret.pkg[subpath] = mapFile;
        ret.src[subpath] = mapFile;
        ret.ids[mapFile.getId()] = mapFile;
        ret.map.res[mapFile.getId()] = {
            uri: mapFile.getUrl(opt.hash, opt.domain),
            type: "js"
        };
        file.addRequire(mapFile.getId());

        var pkgInfo = ret.map.res[file.getId()];
        if (pkgInfo) {
            pkgInfo.deps = pkgInfo.deps || [];
            ~pkgInfo.deps.indexOf(mapFile.getId()) || pkgInfo.deps.push(mapFile.getId());
        }
    }
}

var cache = {};
var stack = {};
function getPaths(file, ret, ignoreSync) {
    var id = file.realpath + (ignoreSync ? '1' : '0');

    if (stack[id]) {
        return {};
    }

    stack[id] = true;

    if (cache[id]) {
        return cache[id];
    }

    var list = {};
    var async = file.extras && file.extras.asyncPaths ? file.extras.asyncPaths : {};

    Object.keys(async).forEach(function(key) {
        var id = async[key];
        var file = ret.ids[id];
        if (file) {
            mixin(list, getPaths(file, ret));
        }
    });
    mixin(list, async);

    var sync =  file.extras && file.extras.paths ? file.extras.paths : {};

    Object.keys(sync).forEach(function(key) {
        var id = sync[key];
        var file = ret.ids[id];
        if (file) {
            mixin(list, getPaths(file, ret, ignoreSync));
        }
    });

    if (!ignoreSync) {
        mixin(list, sync);
    }

    cache[id] = list;
    delete stack[id];
    return list;
}

function mixin(a, b) {
    if (a && b) {
        for (var key in b) {
            a[key] = b[key];
        }
    }
    return a;
};


// auto inject
var handlers = fis.config.get('modules.prepackager', []);
if (handlers && !Array.isArray(handlers)) {
    handlers = typeof handlers === 'string' ? handlers.split(/\s*,\s*/) : [handlers];
}
handlers.unshift(packager);
fis.config.set('modules.prepackager', handlers);