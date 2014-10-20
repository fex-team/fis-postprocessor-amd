define('amd/complexCircleDependency2/h1',  
    ['require', 'amd/complexCircleDependency2/h2'],function ( require ) {
        var h2 = require('amd/complexCircleDependency2/h2');
        return {
            name: 'amd/complexCircleDependency2/h1',
            check: function () {
                var valid = 
                    h2.name == 'amd/complexCircleDependency2/h2'
                    && h2.check();
                return valid;
            }
        };
    }
);