define('/amd/simpleCircleDependency3/c', 
    ['require', '/amd/simpleCircleDependency3/index'],function ( require ) {
        var index = require('/amd/simpleCircleDependency3/index');
        return {
            name: 'amd/simpleCircleDependency3/c',
            check: function () {
                return index.name == 'amd/simpleCircleDependency3/index';
            }
        };
    }
);