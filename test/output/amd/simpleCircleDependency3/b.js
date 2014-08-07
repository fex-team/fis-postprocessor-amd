define('/amd/simpleCircleDependency3/b', 
    ['require', '/amd/simpleCircleDependency3/c'],function ( require ) {
        var c = require('/amd/simpleCircleDependency3/c');
        return {
            name: 'amd/simpleCircleDependency3/b',
            check: function () {
                return c.name == 'amd/simpleCircleDependency3/c' && c.check();
            }
        };
    }
);