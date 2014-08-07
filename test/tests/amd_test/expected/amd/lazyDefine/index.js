define('/amd/lazyDefine/index',  ['require', '/amd/lazyDefine/sea'],function( require ) {
    window.__eslIsLazyDefine = window.__eslLazyDefine != 'sea';
    var sea = require('/amd/lazyDefine/sea');

    return {
        name: 'amd/lazyDefine/index'
    };
});