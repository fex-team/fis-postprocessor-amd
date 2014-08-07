define('/amd/complexCircleDependency3/e',  
    ['require', '/amd/complexCircleDependency3/index'],function ( require ) {
        var index = require('/amd/complexCircleDependency3/index');
        return {
            name: 'amd/complexCircleDependency3/e',
            check: function () {
                var valid = 
                    index.name == 'amd/complexCircleDependency3/index';
                return valid;
            }
        };
    }
);