define('amd/simpleCircleDependency/b', 
    ['require', 'amd/simpleCircleDependency/c'],function ( require ) {
        var c = require('amd/simpleCircleDependency/c');
        return {
            name: 'amd/simpleCircleDependency/b',
            check: function () {
                return c.name == 'amd/simpleCircleDependency/c' && c.check();
            }
        };
    }
);