define('/app', ['require', '/util/index', '/util/each'],function(require) {
    var util = require('/util/index');
    var each = require('/util/each');


    return function init() {
        each([], function() {
            // empty
        });
    }
});