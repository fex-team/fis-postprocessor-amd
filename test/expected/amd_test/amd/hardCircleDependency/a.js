define('amd/hardCircleDependency/a',  
    ['require', 'amd/hardCircleDependency/b'], 
    function ( require ) {
        return {
            name: 'amd/hardCircleDependency/a',
            check: function () {
                var b = require('amd/hardCircleDependency/b');
                var valid = b.name == 'amd/hardCircleDependency/b' && b.check();
                return valid;
            }
        };
    }
);