define('/amd/complexCircleDependency/b', 
    ['/amd/complexCircleDependency/c'],
    function (c) {
        c.name;
        return {name: 'b'};
    }
);