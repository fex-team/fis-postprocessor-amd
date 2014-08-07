define('/amd/complexCircleDependency3/d',  
    ['require', '/amd/complexCircleDependency3/b', '/amd/complexCircleDependency3/e'],function ( require ) {
        var b = require('/amd/complexCircleDependency3/b');
        var e = require('/amd/complexCircleDependency3/e');
        return {
            name: 'amd/complexCircleDependency3/d',
            check: function () {
                var valid = 
                    b.name == 'amd/complexCircleDependency3/b'
                    && e.name == 'amd/complexCircleDependency3/e'
                    && e.check();
                return valid;
            }
        };
    }
);