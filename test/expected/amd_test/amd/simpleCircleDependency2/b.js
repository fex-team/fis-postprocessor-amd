define('amd/simpleCircleDependency2/b', 
    ['require', 'amd/simpleCircleDependency2/c'],function ( require ) {
        return {
            name: 'amd/simpleCircleDependency2/b',
            check: function () {
                var c = require('amd/simpleCircleDependency2/c');
                return c.name == 'amd/simpleCircleDependency2/c' && c.check();
            }
        };
    }
);