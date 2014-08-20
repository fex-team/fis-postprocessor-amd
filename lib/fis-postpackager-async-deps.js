var packager = module.exports = function(ret, conf, settings, opt) {

    // 只处理 pack 的情况
    if (!opt.pack) {
        return;
    }

    fis.util.map(ret.src, function(subpath, file){
        if (file.isAsyncMap && file.moduleMap) {
            genPaths(file, ret, opt);
        }
    });
};

function genPaths(file, ret, opt) {
    var map = file.moduleMap;
    var pkgFiles, res, pkg;

    Object.keys(map).forEach(function(moduleId) {
        var fileId = map[moduleId];
        var res = ret.map.res[fileId];
        var uri = res.uri;
        var pkg;

        if (res.pkg && (pkg = ret.map.pkg[res.pkg])) {
            uri = pkg.uri;
        }

        uri = uri.replace(/\.js$/i, '');

        if (moduleId === uri) {
            delete map[moduleId];
        } else {
            map[moduleId] = uri;
        }
    });

    var code = 'require.config({"paths":' + JSON.stringify(map, null, opt.optimize ? null : 4) + '});';
    var origin = file.getContent();
    file.setContent(code);

    res = ret.map.res[file.getId()];
    if (res.pkg && (pkg = ret.map.pkg[res.pkg])) {
        
        pkgFiles = findPkgFile(ret.pkg, pkg, opt);
        
        pkgFiles.forEach(function(file) {
            var content = file.getContent();
            var idx = content.indexOf(origin);

            if (~idx) {
                content = strSplice(content, idx, origin.length, code);
                file.setContent(content);
            }
        });
    }


    // 更新 uri
    // ret.map.res[file.getId()].uri = file.getUrl(opt.hash, opt.domain);
}

function strSplice(str, index, count, add) {
    return str.slice(0, index) + add + str.slice(index + count);
}

function findPkgFile(obj, pkg, opt) {
    var ret = [];

    fis.util.map(obj, function(subpath, file){
        if (file.getUrl(opt.hash, opt.domain) === pkg.uri) {
            ret.push(file);
        }
    });

    return ret;
}

// auto inject
var handlers = fis.config.get('modules.postpackager', []);
if (handlers && !Array.isArray(handlers)) {
    handlers = typeof handlers === 'string' ? handlers.split(/\s*,\s*/) : [handlers];
}
handlers.unshift(packager);
fis.config.set('modules.postpackager', handlers);