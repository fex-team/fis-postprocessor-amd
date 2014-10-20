/*
      index --->>--- b --->>--- c
        \                      /
         \                    /
           ---------<--------
*/

define('amd/simpleCircleDependency/index', 
    ['require', 'amd/simpleCircleDependency/b'],function ( require ) {
        var b = require('amd/simpleCircleDependency/b');
        return {
            name: 'amd/simpleCircleDependency/index',
            check: function () {
                return b.name == 'amd/simpleCircleDependency/b' && b.check();
            }
        };
    }
);