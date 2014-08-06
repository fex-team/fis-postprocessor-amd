require.config({"paths":{
    "modA": "/modA",
    "modB": "/modB"
}});
;define('ns/modC', function(require) {
    require(['modA', 'modB'], function() {
        
    });

    return 3;
});