define('/amd/deepDependency3/d',  ['require', '/amd/deepDependency3/c', '/amd/deepDependency3/e'],function ( require ) {
    var c = require('/amd/deepDependency3/c');
    var e = require('/amd/deepDependency3/e');

    return {
        name: 'amd/deepDependency3/d',
        check: function () {
            var valid =
                c.name == 'amd/deepDependency3/c'
                && e.name == 'amd/deepDependency3/e'
            return valid;
        }
    };
} );
