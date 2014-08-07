define('/amd/simpleCircleDependency2/c', 
    ['require', '/amd/simpleCircleDependency2/index'],function ( require ) {
        var index = require('/amd/simpleCircleDependency2/index');
        return {
            name: 'amd/simpleCircleDependency2/c',
            check: function () {
                return index.name == 'amd/simpleCircleDependency2/index';
            }
        };
    }
);