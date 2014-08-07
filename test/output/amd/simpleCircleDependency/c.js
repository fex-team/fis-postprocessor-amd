define('/amd/simpleCircleDependency/c', 
    ['require', '/amd/simpleCircleDependency/index'],function ( require ) {
        return {
            name: 'amd/simpleCircleDependency/c',
            check: function () {
                var index = require('/amd/simpleCircleDependency/index');
                return index.name == 'amd/simpleCircleDependency/index';
            }
        };
    }
);