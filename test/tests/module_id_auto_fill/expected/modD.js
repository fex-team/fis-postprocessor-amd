define('/modD', ['require', '/modA', '/modB'],function(require) {
    var modA = require('/modA');
    var modB = require('/modB');

    return {
        d: 4
    }
});