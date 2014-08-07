define('/amd/complexCircleDependency3/c',  
    ['require', '/amd/complexCircleDependency3/g', '/amd/complexCircleDependency3/d'],function ( require ) {
        var g = require('/amd/complexCircleDependency3/g');
        return {
            name: 'amd/complexCircleDependency3/c',
            check: function () {
                var d = require('/amd/complexCircleDependency3/d');
                var valid = 
                    g.name == 'amd/complexCircleDependency3/g'
                    && g.check()
                    && d.name == 'amd/complexCircleDependency3/d'
                    && d.check();
                return valid;
            }
        };
    }
);