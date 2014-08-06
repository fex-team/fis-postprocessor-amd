define('/modF', ['require', 'exports', 'module', '/modA', '/modB'],function(require, exports, module) {
    var modA = require('/modA');
    var modB = require('/modB');

    module.exports = {
        f: 6
    };
});