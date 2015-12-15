# Rohr.js

## Validation & transformation toolkit

### Installation

`npm install rohr`

### Usage

```es6
var rohr = require('./lib/rohr');

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

rohr(input)

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

.toPromise().then(function(obj) {
    console.log('OUT: ' + JSON.stringify(obj, null, 4));
}).catch(function(err) {
    console.log('ERR: ' + JSON.stringify(err, null, 4));
});

```

Result:
```json
IN: {
    "foo": "4",
    "bar": {
        "yolo": 420,
        "trolo": {
            "bolo": 4
        }
    },
    "testId": 1
}
OUT: {
    "foo": 8,
    "bar": {
        "yolo": "xxxNoScope420xxx",
        "trolo": {
            "bolo": 4
        }
    },
    "more": {
        "nested": {
            "stuff": {
                "testId": {
                    "id": 1,
                    "DATA": "more stuff"
                }
            }
        }
    }
}
```
