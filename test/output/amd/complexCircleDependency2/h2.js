define('/amd/complexCircleDependency2/h2',  
    ['require', '/amd/complexCircleDependency2/s1'],function ( require ) {
        return {
            name: 'amd/complexCircleDependency2/h2',
            check: function () {
                var s1 = require('/amd/complexCircleDependency2/s1');
                var valid = 
                    s1.name == 'amd/complexCircleDependency2/s1'
                    && s1.check();
                return valid;
            }
        };
    }
);