define('ns/mods/modE', ['require', 'exports', 'ns/mods/modA', 'ns/mods/modB'],function(require, exports) {
    var modA = require('ns/mods/modA');
    var modB = require('ns/mods/modB');

    exports.e = 5;
});