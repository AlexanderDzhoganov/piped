/*global
Promise
*/

'use strict';

var _ = require('lodash');

var Rohr = function (object) {
    this._object = object;
    this._prop = null;
    this._propUndefined = false;
    this._scopeInvalid = !object ? true : false;
    this._lastPromise = null;
    this._ancestor = null;
    this._validationErrors = [];
    this._matching = false;
    this._matchStatus = false;
};

Rohr.prototype._getProp = function () {
    return this._object[this._prop];
};

Rohr.prototype._setProp = function (value) {
    this._object[this._prop] = value;
};

Rohr.prototype._transformProp = function (fn) {
    this._setProp(fn(this._getProp()));
};

Rohr.prototype._getScope = function () {
    var self = this,
        scope = '';

    while (self._ancestor) {
        self = self._ancestor;
        scope += self._prop;
    }

    return scope;
};

var decorate = function (fn) {
    return function () {
        var args = _.map(arguments, function (x) { return x; });

        if (this._lastPromise) {
            this._lastPromise = this._lastPromise.then(function (self) {
                args.push(true);
                return fn.apply(self, args);
            });

            return this;
        }

        args.push(false);
        return fn.apply(this, args);
    };
};

Rohr.prototype._toPromise = function (ignoreErrors) {
    if (this._matching) {
        throw 'toPromise() called with dangling ifEquals() without matching endif ()';
    }

    if (ignoreErrors || this._validationErrors.length === 0) {
        return Promise.resolve(this._object);
    }

    return Promise.reject(this._validationErrors);
};

Rohr.prototype.toPromise = function (ignoreErrors) {
    if (this._lastPromise) {
        return this._lastPromise.then(function (self) {
            return self._toPromise(ignoreErrors);
        });
    }

    return this._toPromise(ignoreErrors);
};

Rohr.prototype._resolve = function () {
    return Promise.resolve(this._object);
};

Rohr.prototype.resolve = function () {
    if (this._lastPromise) {
        return this._lastPromise.then(function (self) {
            return self._resolve();
        });
    }

    return this._resolve();
};

Rohr.prototype.object = decorate(function (fn) {
    fn(this._object);
    return this;
});

Rohr.prototype.error = decorate(function (fn) {
    fn(this._validationErrors);
    return this;
});

Rohr.prototype.prop = decorate(function (prop) {
    if (this._matching && !this._matchStatus) {
        return this;
    }

    if (this._scopeInvalid) {
        return this;
    }

    this._prop = prop;

    var value = this._getProp();
    if (value === null || value === undefined) {
        this._validationErrors.push({
            type: 'UndefinedProperty',
            property: this._prop,
            scope: this._getScope()
        });

        this._propUndefined = true;
    } else {
        this._propUndefined = false;
    }

    return this;
});

Rohr.prototype.optional = decorate(function (prop) {
    if (this._matching && !this._matchStatus) {
        return this;
    }

    if (this._scopeInvalid) {
        return this;
    }

    this._prop = prop;

    if (!_.has(this._object, this._prop)) {
        this._propUndefined = true;
    } else {
        this._propUndefined = false;
    }

    return this;
});

Rohr.prototype.set = decorate(function (prop, valueFn, last) {
    if (this._matching && !this._matchStatus) {
        return this;
    }

    if (this._scopeInvalid) {
        return this;
    }

    this._prop = prop;

    if (_.isFunction(valueFn)) {
        var result = valueFn();
        if (result.then) {
            this._lastPromise = result.then(function (value) {
                this._setProp(value);
                return this;
            }.bind(this));

            if (last) {
                return this._lastPromise;
            }
        } else {
            this._setProp(result);
        }

        return this;
    }

    this._setProp(valueFn);
    return this;
});

Rohr.prototype.value = decorate(function (valueFn, last) {
    if (this._matching && !this._matchStatus) {
        return this;
    }

    if (this._scopeInvalid) {
        return this;
    }

    if (!this._prop) {
        throw 'value() called but not inspecting any property';
    }

    if (this._propUndefined) {
        return this;
    }

    if (_.isFunction(valueFn)) {
        var result = valueFn();
        if (result.then) {
            this._lastPromise = result.then(function (value) {
                this._setProp(value);
                return this;
            }.bind(this));

            if (last) {
                return this._lastPromise;
            }
        } else {
            this._setProp(result);
        }

        return this;
    }

    this._setProp(valueFn);
    return this;
});

Rohr.prototype.nuke = decorate(function () {
    if (this._matching && !this._matchStatus) {
        return this;
    }

    if (this._scopeInvalid) {
        return this;
    }

    if (!this._prop) {
        throw 'nuke() called but not inspecting any property';
    }

    if (this._propUndefined) {
        return this;
    }

    delete this._object[this._prop];
    return this;
});

Rohr.prototype.scope = decorate(function () {
    if (this._matching && !this._matchStatus) {
        return this;
    }

    if (this._scopeInvalid) {
        return this;
    }

    if (!this._prop) {
        throw 'scope() called but not inspecting any property';
    }

    var self = null;

    if (this._propUndefined) {
        self = new Rohr(null);
        self._ancestor = this;
        return self;
    }

    if (!_.isObject(this._getProp())) {
        this._validationErrors.push({
            type: 'InvalidScopeToNonObject',
            property: this._prop,
            scope: this._getScope()
        });

        return this;
    }

    self = new Rohr(this._getProp());
    self._ancestor = this;
    return self;
});

Rohr.prototype.scopeBack = decorate(function () {
    if (this._matching && !this._matchStatus) {
        return this;
    }

    if (this._ancestor) {
        this._ancestor._validationErrors =
            this._ancestor._validationErrors.concat(this._validationErrors);
        this._validationErrors = [];

        return this._ancestor;
    }

    return this;
});

Rohr.prototype._rootScope = function () {
    if (this._matching && !this._matchStatus) {
        return this;
    }

    var self = this;
    while (self._ancestor) {
        self._ancestor._validationErrors =
            self._ancestor._validationErrors.concat(self._validationErrors);
        self._validationErrors = [];

        self = self._ancestor;
    }

    return self;
};

Rohr.prototype.rootScope = decorate(Rohr.prototype._rootScope);

Rohr.prototype.castTo = decorate(function (type) {
    if (this._matching && !this._matchStatus) {
        return this;
    }

    if (this._scopeInvalid) {
        return this;
    }

    if (!this._prop) {
        throw 'castTo() called but not inspecting any property';
    }

    if (this._propUndefined) {
        return this;
    }

    if (type === 'integer') {
        this._transformProp(function (val) {
            return parseInt(val, 10);
        });
    } else if (type === 'float') {
        this._transformProp(function (val) {
            return parseFloat(val);
        });
    } else if (type === 'string') {
        this._transformProp(function (val) {
            return val.toString();
        });
    } else if (type === 'date') {
        this._transformProp(function (val) {
            return new Date(val);
        });
    } else {
        throw 'castTo() encountered unknown type "' + type + '", expected "integer", "float" or "string"';
    }

    return this;
});

Rohr.prototype.transform = decorate(function (fn, last) {
    if (this._matching && !this._matchStatus) {
        return this;
    }

    if (this._scopeInvalid) {
        return this;
    }

    if (!this._prop) {
        throw 'transform() called but not inspecting any property';
    }

    if (this._propUndefined) {
        return this;
    }

    var result = fn(this._getProp(), this._object, this._rootScope()._object);

    if (result.then) {
        this._lastPromise = result.then(function (result) {
            this._setProp(result);
            return this;
        }.bind(this), function (err) {
            this._validationErrors.push({
                type: 'TransformPromiseRejected',
                property: this._prop,
                error: err,
                scope: this._getScope()
            });
            return this;
        }.bind(this));

        if (last) {
            return this._lastPromise;
        }
    } else {
        this._setProp(result);
    }

    return this;
});

Rohr.prototype.isString = decorate(function () {
    if (this._matching && !this._matchStatus) {
        return this;
    }

    if (this._scopeInvalid) {
        return this;
    }

    if (!this._prop) {
        throw 'isString() called but not inspecting any property';
    }

    if (this._propUndefined) {
        return this;
    }

    if (!_.isString(this._object[this._prop])) {
        this._validationErrors.push({
            type: 'InvalidPropertyType',
            property: this._prop,
            expectedType: 'string',
            actualType: typeof (this._object[this._prop]),
            scope: this._getScope()
        });
    }

    return this;
});

Rohr.prototype.isNumber = decorate(function () {
    if (this._matching && !this._matchStatus) {
        return this;
    }

    if (this._scopeInvalid) {
        return this;
    }

    if (!this._prop) {
        throw 'isNumber() called but not inspecting any property';
    }

    if (this._propUndefined) {
        return this;
    }

    if (!_.isNumber(this._object[this._prop])) {
        this._validationErrors.push({
            type: 'InvalidPropertyType',
            property: this._prop,
            expectedType: 'number',
            actualType: typeof (this._object[this._prop]),
            scope: this._getScope()
        });
    }

    return this;
});

Rohr.prototype.isBoolean = decorate(function () {
    if (this._matching && !this._matchStatus) {
        return this;
    }

    if (this._scopeInvalid) {
        return this;
    }

    if (!this._prop) {
        throw 'isBoolean() called but not inspecting any property';
    }

    if (this._propUndefined) {
        return this;
    }

    if (!_.isBoolean(this._object[this._prop])) {
        this._validationErrors.push({
            type: 'InvalidPropertyType',
            property: this._prop,
            expectedType: 'bool',
            actualType: typeof (this._object[this._prop]),
            scope: this._getScope()
        });
    }

    return this;
});

Rohr.prototype.isArray = decorate(function () {
    if (this._matching && !this._matchStatus) {
        return this;
    }

    if (this._scopeInvalid) {
        return this;
    }

    if (!this._prop) {
        throw 'isArray() called but not inspecting any property';
    }

    if (this._propUndefined) {
        return this;
    }

    if (!_.isArray(this._object[this._prop])) {
        this._validationErrors.push({
            type: 'InvalidPropertyType',
            property: this._prop,
            expectedType: 'array',
            actualType: typeof (this._object[this._prop]),
            scope: this._getScope()
        });
    }

    return this;
});

Rohr.prototype.isObject = decorate(function () {
    if (this._matching && !this._matchStatus) {
        return this;
    }

    if (this._scopeInvalid) {
        return this;
    }

    if (!this._prop) {
        throw 'isObject() called but not inspecting any property';
    }

    if (this._propUndefined) {
        return this;
    }

    if (!_.isObject(this._object[this._prop])) {
        this._validationErrors.push({
            type: 'InvalidPropertyType',
            property: this._prop,
            expectedType: 'object',
            actualType: typeof (this._object[this._prop]),
            scope: this._getScope()
        });
    }

    return this;
});

Rohr.prototype.isDate = decorate(function () {
    if (this._matching && !this._matchStatus) {
        return this;
    }

    if (this._scopeInvalid) {
        return this;
    }

    if (!this._prop) {
        throw 'isObject() called but not inspecting any property';
    }

    if (this._propUndefined) {
        return this;
    }

    if (!_.isDate(this._object[this._prop])) {
        this._validationErrors.push({
            type: 'InvalidPropertyType',
            property: this._prop,
            expectedType: 'date',
            actualType: typeof (this._object[this._prop]),
            scope: this._getScope()
        });
    }

    return this;
});

Rohr.prototype._lookupArray = function (haystack, key) {
    var value = this._getProp(),
        needle = null;

    needle = _.find(haystack, function (item) {
        if (!item[key]) {
            return false;
        }

        return item[key] === value;
    });

    if (!needle) {
        this._validationErrors.push({
            type: 'LookupFailed',
            property: this._prop,
            key: key,
            scope: this._getScope()
        });

        return this;
    }
    this._setProp(needle);
    return this;
};

Rohr.prototype._lookupObject = function (haystack, key) {
    var needle = haystack[this._getProp()];

    if (!needle) {
        this._validationErrors.push({
            type: 'LookupFailed',
            property: this._prop,
            key: key,
            scope: this._getScope()
        });

        return this;
    }

    this._setProp(needle);
    return this;
};

Rohr.prototype.lookup = decorate(function (haystack, key) {
    if (this._matching && !this._matchStatus) {
        return this;
    }

    if (this._scopeInvalid) {
        return this;
    }

    if (!this._prop) {
        throw 'lookup() called but not inspecting any property';
    }

    if (this._propUndefined) {
        return this;
    }

    if (_.isArray(haystack)) {
        return this._lookupArray(haystack, key);
    }

    if (_.isObject(haystack)) {
        return this._lookupObject(haystack, key);
    }

    throw 'lookup() supports "object" and "array", not "' + typeof haystack + '"';
});

Rohr.prototype.map = decorate(function (fn) {
    if (this._matching && !this._matchStatus) {
        return this;
    }

    if (this._scopeInvalid) {
        return this;
    }

    if (!this._prop) {
        throw 'map() called but not inspecting any property';
    }

    if (this._propUndefined) {
        return this;
    }

    if (!_.isArray(this._getProp())) {
        this._validationErrors.push({
            type: 'MapOverNonArray',
            property: this._prop,
            propertyType: typeof (this._getProp()),
            scope: this._getScope()
        });
    }

    this._lastPromise = Promise.all(_.map(this._getProp(), function (value) {
        var result = fn(value);
        if (result.then) {
            return result;
        }

        return Promise.resolve(result);
    })).then(function (array) {
        this._setProp(array);
        return this;
    }.bind(this));

    return this;
});

Rohr.prototype.rename = decorate(function (name) {
    if (this._matching && !this._matchStatus) {
        return this;
    }

    if (this._scopeInvalid) {
        return this;
    }

    if (!this._prop) {
        throw 'rename() called but not inspecting any property';
    }

    if (this._propUndefined) {
        return this;
    }

    var value = this._getProp();
    delete this._object[this._prop];
    this._prop = name;
    this._setProp(value);
    return this;
});

Rohr.prototype.rescope = decorate(function (path, startAtRoot) {
    if (startAtRoot === undefined || startAtRoot === null) {
        startAtRoot = true;
    }

    if (this._matching && !this._matchStatus) {
        return this;
    }

    if (this._scopeInvalid) {
        return this;
    }

    if (!this._prop) {
        throw 'rescope() called but not inspecting any property';
    }

    if (this._propUndefined) {
        return this;
    }

    var value = this._getProp(),
        scope = this;

    if (startAtRoot) {
        scope = this._rootScope();
    }

    _.each(path.split('.'), function (key) {
        if (!scope._object[key] || !_.isObject(scope._object[key])) {
            scope._object[key] = {};
        }

        var old = scope;
        scope = new Rohr(scope._object[key]);
        scope._ancestor = old;
    });

    scope._prop = this._prop;
    scope._setProp(value);

    delete this._object[this._prop];
    this._propUndefined = true;

    return scope;
});

Rohr.prototype.broadcast = decorate(function (fields) {
    if (this._matching && !this._matchStatus) {
        return this;
    }

    if (this._scopeInvalid) {
        return this;
    }

    if (!this._prop) {
        throw 'broadcast() called but not inspecting any property';
    }

    if (this._propUndefined) {
        return this;
    }

    if (!_.isArray(fields)) {
        fields = [fields];
    }

    var value = this._getProp();

    _.each(fields, function (field) {
        this._object[field] = value;
    }.bind(this));

    return this;
});

Rohr.prototype.validate = decorate(function (fn) {
    if (this._matching && !this._matchStatus) {
        return this;
    }

    if (this._scopeInvalid) {
        return this;
    }

    if (!this._prop) {
        throw 'validate() called but not inspecting any property';
    }

    if (this._propUndefined) {
        return this;
    }

    var result = fn(this._getProp());
    if (result.then) {
        this._lastPromise = result.then(function () {
            return this;
        }.bind(this), function (err) {
            this._validationErrors.push({
                type: 'ValidationError',
                property: this._prop,
                err: err,
                scope: this._getScope()
            });

            return this;
        }.bind(this));

        return this;
    }

    if (!result) {
        this._validationErrors.push({
            type: 'ValidationError',
            property: this._prop,
            scope: this._getScope()
        });
    }

    return this;
});

Rohr.prototype._ifEqualsFn = function (fn, last) {
    this._matching = true;
    var result = fn(this._getProp());

    if (result.then) {
        this._lastPromise = result.then(function (value) {
            this._matchStatus = value === this._getProp();
            return this;
        }.bind(this));

        if (last) {
            return this._lastPromise;
        }

        return this;
    }

    this._matchStatus = this._getProp() === result;
    return this;
};

Rohr.prototype._ifEqualsValue = function (value) {
    this._matching = true;
    this._matchStatus = this._getProp() === value;
    return this;
};

Rohr.prototype.ifEquals = decorate(function (arg, last) {
    if (!this._prop) {
        throw 'ifEquals() called but not inspecting any property';
    }

    if (this._propUndefined) {
        return this;
    }

    if (this._matching) {
        throw 'nested ifEquals() calls are not allowed';
    }

    if (this._scopeInvalid) {
        return this;
    }

    if (_.isFunction(arg)) {
        return this._ifEqualsFn(arg, last);
    }

    return this._ifEqualsValue(arg);
});

Rohr.prototype.endIf = decorate(function () {
    if (!this._prop) {
        throw 'endif () called but not inspecting any property';
    }

    if (this._propUndefined) {
        return this;
    }

    if (!this._matching) {
        throw 'endif () called without preceding ifEquals()';
    }

    if (this._scopeInvalid) {
        return this;
    }

    this._matching = false;
    this._matchStatus = false;
    return this;
});

module.exports = Rohr;
