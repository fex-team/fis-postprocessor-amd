define(function(require) {
    return 5;
});


// globa async as sync
require(['./modA', './modB'], function(modA, modB) {
    console.log('here');
});