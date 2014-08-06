define('ns/mods/modF', ['require', 'exports', 'module', 'ns/mods/modA', 'ns/mods/modB'],function(require, exports, module) {
    var modA = require('ns/mods/modA');
    var modB = require('ns/mods/modB');

    module.exports = {
        f: 6
    };
});