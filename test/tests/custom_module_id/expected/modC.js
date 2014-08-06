define('modC', ['require', 'modA'],function(require) {
    var modA = require('modA');
    return 456;
});