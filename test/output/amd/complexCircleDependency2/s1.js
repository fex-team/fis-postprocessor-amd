define('/amd/complexCircleDependency2/s1',  
    ['require', '/amd/complexCircleDependency2/h3'],function ( require ) {
        var h3 = require('/amd/complexCircleDependency2/h3');
        return {
            name: 'amd/complexCircleDependency2/s1',
            check: function () {
                var valid = 
                    h3.name == 'amd/complexCircleDependency2/h3'
                    && h3.check();
                return valid;
            }
        };
    }
);