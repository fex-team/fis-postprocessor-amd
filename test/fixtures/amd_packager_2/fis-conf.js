// fis.config.set('namespace', 'test');

var postprocessor = require('../../../');

fis.config.set('modules.postprocessor.js', postprocessor);


fis.config.set('settings.postprocessor', [{
    // 用于定位模块文件用的.
    baseUrl: '.',
    paths: {},
    packages: [
        {
            name: 'util',
            location: 'util',
            main: 'index'
        }
    ],
    wrapAll: true
}]);