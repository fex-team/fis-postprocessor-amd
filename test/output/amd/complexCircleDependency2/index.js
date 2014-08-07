/*
      index --->>--- h1 --->>--- h2 --->--- s1 --->>--- h3 
                       \                                /
                        \                              /
                          --------------<<-------------
*/


define('/amd/complexCircleDependency2/index',  
    ['require', '/amd/complexCircleDependency2/h1'],function ( require ) {
        var h1 = require('/amd/complexCircleDependency2/h1');
        return {
            name: 'amd/complexCircleDependency2/index',
            check: function () {
                var valid = 
                    h1.name == 'amd/complexCircleDependency2/h1'
                    && h1.check();
                return valid;
            }
        };
    }
);