define('ns:mods/modD', ['require', 'ns:mods/modA', 'ns:mods/modB'],function(require) {
    var modA = require('ns:mods/modA');
    var modB = require('ns:mods/modB');

    return {
        d: 4
    }
});