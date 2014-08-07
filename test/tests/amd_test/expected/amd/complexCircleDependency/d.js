define('/amd/complexCircleDependency/d', 
    ['/amd/complexCircleDependency/e'],
    function (e) {
        e.name;
        return {name: 'd'};
    }
);