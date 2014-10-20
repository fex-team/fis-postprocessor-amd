define('amd/complexCircleDependency2/h3',  
    ['require', 'amd/complexCircleDependency2/h1'],function ( require ) {
        var h1 = require('amd/complexCircleDependency2/h1');
        return {
            name: 'amd/complexCircleDependency2/h3',
            check: function () {
                var valid = 
                    h1.name == 'amd/complexCircleDependency2/h1';
                return valid;
            }
        };
    }
);