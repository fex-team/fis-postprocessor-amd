require(['test1'], function(test1) {

});

require(['test1'], function(test1) {

});

require('test1');

// 正常用法
define('test2', ['require', 'test1'],function(require) {
    require('test1');
});

require(['test1']);

require(['test1'], function(test1) {

});
