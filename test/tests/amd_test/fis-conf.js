var postprocessor = require('../../../');

fis.config.set('modules.postprocessor.js', postprocessor);
fis.config.set('modules.postprocessor.html', postprocessor);


fis.config.set('settings.postprocessor', [{
    // 用于定位模块文件用的.
    baseUrl: '.',
    paths: {
        'css': './esl/css',
        'js': './esl/js',
        'abspath': 'pathstest/index.js',
        'relapath': 'pathstest/rela/index.js',
        'bar': 'tests/packagesConfig/bar/0.4/scripts/main.js',
        'foo': 'tests/packagesConfig/foo/lib/main.js',
        'alpha': 'tests/packagesConfig/pkgs/alpha/main.js',
        'beta': 'tests/packagesConfig/pkgs/beta/0.2/scripts/beta.js',
        'dojox/chair': 'tests/packagesConfig/pkgs/dojox/chair/main.js'
    },
    packages: [
        {
            name: 'pkgclassic',
            location: 'pkgclassic/1.0'
        },
        {
            name: 'pkgsetmain',
            location: 'pkgsetmain/2.0',
            main: 'index'
        }
    ],
    wrapAll: true
}]);

fis.config.set('roadmap.path', [
{
    // 强制不通过 amd 包装。
    reg: '*.html',
    useMap: true
},
{
    // 强制不通过 amd 包装。
    reg: 'impl/**',
    useAMD: false,
    useAMDWrap: false
}
]);