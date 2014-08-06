require.config({"paths":{
    "modA": "/modA_f1096a5",
    "modB": "/modB_4049228"
}});
;define('ns/modC', function(require) {
    require(['modA', 'modB'], function() {
        
    });

    return 3;
});