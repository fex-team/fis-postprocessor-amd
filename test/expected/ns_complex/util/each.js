define('ns:util/each', function() {
    return function(arr, iterator) {
        arr.forEach(iterator);
    }
});