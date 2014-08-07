define('/amd/deepDependency3/a',  ['require', '/amd/deepDependency3/c'],function ( require ) {
    var c = require('/amd/deepDependency3/c');

    return {
        name: 'amd/deepDependency3/a',
        check: function () {
            var valid =
                c.name == 'amd/deepDependency3/c';
            return valid;
        }
    };
} );
