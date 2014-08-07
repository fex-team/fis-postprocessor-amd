define('/amd/complexCircleDependency3/i',  
    ['require', '/amd/complexCircleDependency3/j'],function ( require ) {
        var j = require('/amd/complexCircleDependency3/j');
        return {
            name: 'amd/complexCircleDependency3/i',
            check: function () {
                var valid = 
                    j.name == 'amd/complexCircleDependency3/j'
                    && j.check();
                return valid;
            }
        };
    }
);