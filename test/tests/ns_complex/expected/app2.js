define('ns/app2', ['ns/util/each', 'ns/util/each', 'ns/util/each', 'ns/util/each'], function(e1, e2, e3, e4) {
    return 6;
});

define('app4', ['require', 'ns/util/each'],function(require) {
    var a = require('ns/util/each');
    var b = require('ns/util/each');
    var c = require('ns/util/each');
    var d = require('ns/util/each');

    return 6;
});