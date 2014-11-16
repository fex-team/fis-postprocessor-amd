(function() {

    var require = function() {

    };

    function define() {

    };

    define('a', function() {

    });


    define({
        a: 1
    });

    define(function() {
        console.log('fdafa');
    });

    return require('a');
})();

define(function() {
    console.log('This is not local!');
});

require(['./script'], function() {
    console.log('And this is not local either');
});