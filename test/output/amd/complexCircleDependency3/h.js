define('/amd/complexCircleDependency3/h',  
    ['require', '/amd/complexCircleDependency3/i'],function ( require ) {
        
        return {
            name: 'amd/complexCircleDependency3/h',
            check: function () {
                var i = require('/amd/complexCircleDependency3/i');
                var valid = 
                    i.name == 'amd/complexCircleDependency3/i'
                    && i.check();
                return valid;
            }
        };
    }
);