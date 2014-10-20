define('ns:modD', function(require) {
    require(['ns:modA', 'ns:modB'], function(modA, modB) {
        console.log('here');
    });

    return 4;
});