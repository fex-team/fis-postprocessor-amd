define('modB', ['require', 'modA'],function(require) {
    var modA = require('modA');
    return 123;
});