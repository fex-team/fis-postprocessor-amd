define('/amd/btModuleId/index', 
    ['require', '/amd/btModuleId/has.dot'],function ( require ) {
        var hasDot = require('/amd/btModuleId/has.dot');
        
        return {
            name: 'amd/btModuleId/index',
            check: function () {
                return hasDot.name == 'amd/btModuleId/has.dot'
            }
        };
    }
);