define(function(require) {
    var modH = require('./mods/modH');
    var modI = require('modIIIIIII');
    var modII = require('ns:mods/modI.js');

    return 4;
});

define('app2', ['ns:util/index.js', 'util', './util/index.js', './util/index'], function(u1, u2, u3, u4) {
    return 5;
});


define('app3', ['ns:util/each.js', 'util/each', './util/each.js', './util/each'], function(e1, e2, e3, e4) {
    return 6;
});

define('app4', function(require) {
    var a = require('ns:util/each.js');
    var b = require('util/each');
    var c = require('./util/each.js');
    var d = require('./util/each');

    return 6;
});