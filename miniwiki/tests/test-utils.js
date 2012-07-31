function eachAsync(array, func, callback) {
    var numItems = array.length,
        itemsComplete = 0,
        results = {},
        slice = Array.prototype.slice,
        extraArgs = slice.call(arguments, 2);

    if (numItems === 0) {
        return callback(results);
    }

    for(var i = 0; i < numItems; ++i) {
        func(array[i], i, function (err) {
            if (err) {
                results[i] = { error: err };
            } else {
                results[i] = { result: slice.call(arguments, 1) };
            }

            ++itemsComplete;
            if (itemsComplete === numItems) {
                callback(results);
            }
        });
    }
}

exports.eachAsync = eachAsync;