[![npm version](https://badge.fury.io/js/rohr.svg)](https://www.npmjs.com/package/rohr)
[![](https://travis-ci.org/AlexanderDzhoganov/rohr.js.svg?branch=master)](https://travis-ci.org/AlexanderDzhoganov/rohr.js)
[![codecov.io](https://codecov.io/github/AlexanderDzhoganov/rohr.js/coverage.svg?branch=master)](https://codecov.io/github/AlexanderDzhoganov/rohr.js?branch=master)
[![](https://david-dm.org/AlexanderDzhoganov/rohr.js.svg)](https://david-dm.org/AlexanderDzhoganov/rohr.js)

# rohr.js - validation & transformation library

#### Rohr helps you to:
- Reliably extract data from complex hierarchies
- Validate JSON requests in your API server
- Freely mix synchronous and asynchronous transformations on your data
- Integrate APIs together
- Easily bring in legacy data 

### Installation

```
npm install rohr
```

Running the tests:
```
npm install
npm test
```

### Basic example

Rohr is under active development and some of the documentation may be lacking or obsolete. [See the test suite for up-to-date examples](https://github.com/AlexanderDzhoganov/rohr.js/blob/master/test/rohr.spec.js).

```es6
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

```

Result:
```json
{
    "foo": 84
}
```

## Handling errors

Rohr does not stop when it encounters an error but instead logs it and continues processing the rest of the data.
The list of errors can be obtained by calling `.error(callback)` where `callback` is of type `function (errors) {}`.
Each error objects contains information about where the error occured as well as an error type. If using `.toPromise()`, any encountered errors during processing will cause the promise to be rejected. This behavior can be overriden by calling `.toPromise(true)` instead and using `.error()` to handle errors.

Error type               | Description
------------------------ | -----------------------------------------------------------------
UndefinedProperty        | A property selected with `.prop()` was not found in the input data. Error data contains `property` which is the property name and `scope` which is the scope where the error occured.
InvalidScopeToNonObject  | When calling `.scope()` on a non-object.
TransformPromiseRejected | A promise returned a `.transform()` call was rejected, the rejection error can be found in the `err` property. 
InvalidPropertyType      | A type check (e.g. `isString()`, `isNumber()`) failed. Error data: `property`, `expectedType`, `actualType`, `scope`
LookupFailed             | A `lookup()` call failed to find a match for the selected property. Error data: `property`, `key`, `scope`
MapOverNonArray          | When calling `.map()` on a non-array type.
ValidationError          | When `validate()` fails by either the callback returning `false` or a rejected promise. In the case of a promise the rejection error will be in the `err` property of the error object.

## API

Method                          | Description                                                
------------------------------- | ---------------------------------------------------------------------------------------
prop(propertyName)              | Selects a property in the current scope, adds a validation error if the property is `null` or `undefined`.
optional(propertyName)          | Selects a property in the current scope, no validation if performed if the property exists. Any further chained methods for this property will be ignored if its value is `null` or `undefined`.
set(propertyName, [value/fn])   | Sets the value for a property, value can be a value or a function returning a value/ promise resolving to a value.
value([value/fn])               | Sets the value of the currently selected property (by using `prop()` or `optional()`). Single argument is a value or a function returning a value or a promise resolving to a value.
nuke()                          | Removes the selected property from the object.
scope()                         | Enters the scope of the currently selected property. Only valid if property is an object.
scopeBack()                     | Brings you back to the previous scope.
rootScope()                     | Brings you back to the root scope.
castTo(typeName)                | Casts the currently selected property to a specific type given by `typeName`. Allowed values are: `integer`, `float`, `string`, `date`.
transform(fn)                   | Transforms the currently selected property with a function of the type `function (value, [scope], [rootScope]) {}`. The function can return a new value or a promise resolving to the new value.
isString()                      | Ensures the currently selected property is of type `String`, adds a validation error otherwise.
isNumber()                      | Ensures the currently selected property is of type `Number`, adds a validation error otherwise.
isDate()                        | Ensures the currently selected property is of type `Date`, adds a validation error otherwise.
isArray()                       | Ensures the currently selected property is of type `Array`, adds a validation error otherwise.
isObject()                      | Ensures the currently selected property is of type `Object`, adds a validation error otherwise.
lookup([array/object], optional:key)     | Performs a look-up for the currently selected property in an array or an object. `key` tells the library which key to look for in the objects if an `array` is passed as the first argument.
map(fn)                         | Maps every object of the currently selected `array` property using a function of the type `function (value) {}`. The function can return a new value for each item in the array or a promise resolving to the new value or a mix of those.
rename(propertyName)            | Renames the currently selected property.
rescope(propertyPath)           | Moves the currently selected property to a new scope. The path starts from the root of the object and accepts dots `.` (e.g. `foo.bar`). Any non-existing properties are created automatically, existing properties are overwritten.
broadcast([propertyName/array]) | Broadcasts the value of the currently selected property to one or more other properties. Single argument is either a string or an array of strings.
validate(fn)                    | Validates the value of the currently selected property using `fn` which is a `function (value) {}` which returns a boolean or a promise. A resolved promise means the validation is successful and no further action is taken, a rejected promise will result in a `ValidationError`, the rejection error can be found in the `err` property of the error object.
toPromise(ignoreErrors)         | Returns a promise that resolves to the transformed object, or is rejected with a list of errors
resolve()                       |
object()                        |
error()                         |
