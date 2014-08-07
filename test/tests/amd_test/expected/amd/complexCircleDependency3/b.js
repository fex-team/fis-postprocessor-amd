define('/amd/complexCircleDependency3/b',  
    ['require', '/amd/complexCircleDependency3/c'],function ( require ) {
        var c = require('/amd/complexCircleDependency3/c');
        return {
            name: 'amd/complexCircleDependency3/b',
            check: function () {
                var valid = 
                    c.name == 'amd/complexCircleDependency3/c'
                    && c.check();
                return valid;
            }
        };
    }
);