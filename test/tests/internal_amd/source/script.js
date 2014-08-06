
(function(factory) {

    define(function() {
        var define = function() {

        };
        
        var require = function() {

        }


        factory(require, define);
    });

})(function(require, define) {

    define('a', function() {
        return 1;
    });

    define('b', function() {
        return 2;
    });

    define(function() {
        return 'I know, this is a mistake.';
    });
});