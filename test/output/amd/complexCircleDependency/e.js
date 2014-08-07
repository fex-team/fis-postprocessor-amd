define('/amd/complexCircleDependency/e', 
    ['require', '/amd/complexCircleDependency/f'],function ( require ) {
        function test() {
            require('/amd/complexCircleDependency/f').name;
        }
        return {name: 'e'};
    }
);