define('ns/app', ['require', 'modHH', 'modIIIIIII'],function(require) {
    var modH = require('modHH');
    var modI = require('modIIIIIII');
    var modII = require('modIIIIIII');

    return 4;
});

define('app2', ['ns/util/index', 'ns/util/index', 'ns/util/index', 'ns/util/index'], function(u1, u2, u3, u4) {
    return 5;
});