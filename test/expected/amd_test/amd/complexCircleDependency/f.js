define('amd/complexCircleDependency/f', 
    ['amd/complexCircleDependency/c', 'amd/complexCircleDependency/g'],
    function (c, g) {
        c.name;g.name;
        return {name: 'f'};
    }
);