define(function(require) {
    require(['./modA', './modB'], function(modA, modB) {
        console.log('here');
    });

    return 4;
});