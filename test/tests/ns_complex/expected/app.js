define(['require', 'modHH', 'modIIIIIII'],'ns/app', function(require) {
    var modH = require('modHH');
    var modI = require('modIIIIIII');
    var modII = require('modIIIIIII');

    return 4;
});

define('app2', ['ns/util/index', 'ns/util/index', 'ns/util/index', 'ns/util/index'], function(u1, u2, u3, u4) {
    return 5;
});


define('app3', ['ns/util/each', 'ns/util/each', 'ns/util/each', 'ns/util/each'], function(e1, e2, e3, e4) {
    return 6;
});

define('app4', ['require', 'ns/util/each'],function(require) {
    var a = require('ns/util/each');
    var b = require('ns/util/each');
    var c = require('ns/util/each');
    var d = require('ns/util/each');

    return 6;
});