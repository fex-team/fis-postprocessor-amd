define('amd/complexCircleDependency/a', 
    ['amd/complexCircleDependency/b'],
    function (b) {
        b.name;
        return {name: 'a'};
    }
);