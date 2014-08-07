define('/amd/complexCircleDependency/c', 
    ['/amd/complexCircleDependency/d'],
    function (d) {
        d.name;
        return {name: 'c'};
    }
);