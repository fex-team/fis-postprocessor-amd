require.async('./test1', function(test1) {

});

require.async(['./test1'], function(test1) {

});

require('./test1');

// 正常用法
define(function() {
    require('./test1');
});

require(['./test1']);

require(['./test1'], function(test1) {

});
