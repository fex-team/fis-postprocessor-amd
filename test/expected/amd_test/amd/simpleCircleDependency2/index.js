/*
      index --->>--- b --->--- c
        \                     /
         \                   /
           --------<<-------
*/


define('amd/simpleCircleDependency2/index', 
    ['require', 'amd/simpleCircleDependency2/b'],function ( require ) {
        var b = require('amd/simpleCircleDependency2/b');
        return {
            name: 'amd/simpleCircleDependency2/index',
            check: function () {
                return b.name == 'amd/simpleCircleDependency2/b' && b.check();
            }
        };
    }
);