define('/amd/complexCircleDependency3/g',  
    ['require', '/amd/complexCircleDependency3/h'],function ( require ) {
        var h = require('/amd/complexCircleDependency3/h');
        return {
            name: 'amd/complexCircleDependency3/g',
            check: function () {
                var valid = 
                    h.name == 'amd/complexCircleDependency3/h'
                    && h.check();
                return valid;
            }
        };
    }
);