define('/amd/relativeDependency/index',  
    ['/amd/relativeDependency/inner/cat'], 
    function ( cat ) {
        return {
            name: 'amd/relativeDependency/index',
            check: function () {
                return cat.name == 'amd/relativeDependency/inner/cat'
            }
        };
    }
);