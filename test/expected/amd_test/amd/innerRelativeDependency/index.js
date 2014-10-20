define( 
    'amd/innerRelativeDependency/index',
    ['require', 'amd/innerRelativeDependency/lion', 'amd/innerRelativeDependency/cat', 'amd/innerRelativeDependency/dog', 'amd/innerRelativeDependency/tiger'],function ( require ) {
        var lion = require('amd/innerRelativeDependency/lion');

        return {
            name: 'amd/innerRelativeDependency/index',
            check: function () {
                var cat = require('amd/innerRelativeDependency/cat');
                var dog = require('amd/innerRelativeDependency/dog');
                var tiger = require('amd/innerRelativeDependency/tiger');
                var valid = 
                    cat.name == 'amd/innerRelativeDependency/cat'
                    && dog.name == 'amd/innerRelativeDependency/dog'
                    && tiger.name == 'amd/innerRelativeDependency/tiger'
                    && lion.name == 'amd/innerRelativeDependency/lion';
                return valid;
            }
        };
    }
);