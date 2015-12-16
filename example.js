var rohr = require('rohr');

var input = {
    "foo": "42"
};

rohr(input)

.prop('foo').isString().castTo('integer').transform(function(val) {
    return val * 2;
})

.toPromise().then(function(object) {
    console.log(object);
});
