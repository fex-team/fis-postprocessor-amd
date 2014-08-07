define('/amd/complexCircleDependency/g', 
    ['/amd/complexCircleDependency/a'],
    function (a) {
        a.name;
        return {name: 'g'};
    }
);