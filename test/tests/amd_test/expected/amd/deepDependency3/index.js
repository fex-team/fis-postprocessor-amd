define('/amd/deepDependency3/index',  ['require', '/amd/deepDependency3/b'],function ( require ) {
    var b = require('/amd/deepDependency3/b');

    return {
        name: 'amd/deepDependency3/index',
        check: function () {
            var valid =
                b.name == 'amd/deepDependency3/b' && b.check()
            return valid;
        }
    };
} );
