define('/amd/deepDependency2/index',  ['require', '/amd/deepDependency2/level1', '/amd/deepDependency2/level2'],function ( require ) {
    return {
        name: 'amd/deepDependency2/index',
        check: function () {
            var level1 = require('/amd/deepDependency2/level1');
            var level2 = require('/amd/deepDependency2/level2');
            var valid =
                level1.name == 'amd/deepDependency2/level1'
                && level1.check()
                && level2.name == 'amd/deepDependency2/level2'
                && level2.check()
            return valid;
        }
    };
})
