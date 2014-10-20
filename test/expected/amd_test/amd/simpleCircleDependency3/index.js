/*
      index --->--- b --->>--- c
        \                     /
         \                   /
           --------<<-------
*/


define('amd/simpleCircleDependency3/index', 
    ['require', 'amd/simpleCircleDependency3/b'],function ( require ) {
        return {
            name: 'amd/simpleCircleDependency3/index',
            check: function () {
                var b = require('amd/simpleCircleDependency3/b');
                return b.name == 'amd/simpleCircleDependency3/b' && b.check();
            }
        };
    }
);