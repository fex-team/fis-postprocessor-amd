fis.config.set('namespace', 'ns');

var postprocessor = require('../../../');

fis.config.set('modules.postprocessor.js', postprocessor);
fis.config.set('modules.postprocessor.html', postprocessor);


fis.config.set('settings.postprocessor', [{
    paths: {
        'modA': './modA.js'
    },

    // 用于定位模块文件用的.
    baseUrl: '.',
    wrapAll: true
}]);

fis.config.set('roadmap.path', [{
    reg: /(.+\.html)$/i,
    useMap: true
},
{
    // 强制不通过 amd 包装。
    reg: 'app.js',
    useAMDWrap: false
}
]);