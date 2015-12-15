var piped = require('./lib/piped');

var input = {
    foo: "4",
    bar: {
        "yolo": 420,
        "trolo": {
            "bolo": 4
        }
    },
    testId: 1
};

var data = [
    { id: 0, data: 'stuff' },
    { id: 1, data: 'more stuff' },
    { id: 2, data: 'even more stuff' }
]

console.log('IN: ' + JSON.stringify(input, null, 4));

piped(input)

.prop('foo').isString().castTo('integer').transform(function(val) {
    return val * 2;
})

.prop('bar').isObject().scope()
    .prop('yolo').isNumber().castTo('string').transform(function(val) {
        return 'xxxNoScope' + val + 'xxx';
    })

    .prop('trolo').scope()
        .prop('bolo').isNumber()

.rootScope()

.prop('testId').isNumber().lookup(data, 'id').rescope('more.nested.stuff').scope()
    .prop('data').isString().rename('DATA')

.rootScope()

.resolve(function(object, err) {
    if(err) {
        console.log('ERR: ' + JSON.stringify(err, null, 4));
    }

    console.log('OUT: ' + JSON.stringify(object, null, 4));
});
