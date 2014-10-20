/*
      index --->>--- b --->>--- c --->>--- g --->>--- h -->--
        \           /          / \                          /
         \         /          /   \                        /
          \        -<<-- d --<     ----<<---- j ---<<--- i
           \              \
            \              \
             -<<-- e --<<---
*/


define('amd/complexCircleDependency3/index',  
    ['require', 'amd/complexCircleDependency3/b'],function ( require ) {
        var b = require('amd/complexCircleDependency3/b');
        return {
            name: 'amd/complexCircleDependency3/index',
            check: function () {
                var valid = 
                    b.name == 'amd/complexCircleDependency3/b'
                    && b.check();
                return valid;
            }
        };
    }
);