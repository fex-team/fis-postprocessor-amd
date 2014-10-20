define('ns:modC', ['require', 'ns:modA', 'ns:modB'],function(require) {
    var a = require('ns:modA');
    var b = require('ns:modB');

    return 3;
});