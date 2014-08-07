define('/amd/deepDependency3/b',  ['require', '/amd/deepDependency3/a', '/amd/deepDependency3/d', '/amd/deepDependency3/e'],function ( require ) {
    var a = require('/amd/deepDependency3/a');
    var d = require('/amd/deepDependency3/d');
    var e = require('/amd/deepDependency3/e');

    return {
        name: 'amd/deepDependency3/b',
        check: function () {
            var valid =
                a.name == 'amd/deepDependency3/a' && a.check()
                && d.name == 'amd/deepDependency3/d' && d.check()
                && e.name == 'amd/deepDependency3/e';
            return valid;
        }
    };
} );
