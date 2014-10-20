define('amd/deepDependency2/level1',  ['require', 'amd/deepDependency2/level3'],function ( require ) {
    return {
        name: 'amd/deepDependency2/level1',
        check: function () {
            var level3 = require('amd/deepDependency2/level3');
            var valid =
                level3.name == 'amd/deepDependency2/level3'
            return valid;
        }
    };
})
