define('ns/modE', function(require) {
    return 5;
});


// globa async as sync
require(['ns/modA', 'ns/modB'], function(modA, modB) {
    console.log('here');
});