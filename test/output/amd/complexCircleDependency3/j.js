define('/amd/complexCircleDependency3/j',  
    ['require', '/amd/complexCircleDependency3/c'],function ( require ) {
        var c = require('/amd/complexCircleDependency3/c');
        return {
            name: 'amd/complexCircleDependency3/j',
            check: function () {
                var valid = 
                    c.name == 'amd/complexCircleDependency3/c';
                return valid;
            }
        };
    }
);