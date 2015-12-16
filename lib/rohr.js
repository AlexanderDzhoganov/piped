var _ = require('lodash');

var Rohr = function(object) {
    this._object = object;
    this._prop = null;
    this._propUndefined = false;
    this._lastPromise = null;
    this._ancestor = null;
    this._validationErrors = [];
}

Rohr.prototype._getProp = function() {
    return this._object[this._prop];
}

Rohr.prototype._setProp = function(value) {
    this._object[this._prop] = value;
}

Rohr.prototype._transformProp = function(fn) {
    this._setProp(fn(this._getProp()));
}

Rohr.prototype._rootScope = function() {
    var self = this;
    while(self._ancestor) {
        self = self._ancestor;
    }

    return self;
}

Rohr.prototype._getScope = function() {
    var self = this;
    var scope = '';
    
    var first = true;
    while(self._ancestor) {
        if(!first) {
            scope += self._prop;
        }

        first = false;
        self = self._ancestor;
    }

    if(scope !== '') {
        return self._prop + '.' + scope;
    } else {
        return self._prop;
    }
}

Rohr.prototype._toPromise = function(ignoreErrors) {
    if(ignoreErrors || this._validationErrors.length === 0) {
        return Promise.resolve(this._object);
    } else {
        return Promise.reject(this._validationErrors);
    }
}

Rohr.prototype.toPromise = function(ignoreErrors) {
    if(this._lastPromise) {
        return this._lastPromise.then(function(self) {
            return self._toPromise(ignoreErrors);
        });
    }

    return this._toPromise(ignoreErrors);
}

Rohr.prototype._resolve = function() {
    return Promise.resolve(this._object);
}

Rohr.prototype.resolve = function() {
    if(this._lastPromise) {
        return this._lastPromise.then(function(self) {
            return self._resolve();
        });
    }

    return this._resolve();
}

Rohr.prototype._objectFn = function(fn) {
    fn(this._object);
    return this;
}

Rohr.prototype.object = function(fn) {
    if(this._lastPromise) {
        this._lastPromise = this._lastPromise.then(function(self) {
            return self._objectFn(fn);
        });

        return this;
    }

    return this._objectFn(fn);
}

Rohr.prototype._error = function(fn) {
    fn(this._validationErrors);
    return this;
}

Rohr.prototype.error = function(fn) {
    if(this._lastPromise) {
        this._lastPromise = this._lastPromise.then(function(self) {
            return self._error(fn);
        });

        return this;
    }

    return this._error(fn);
}

Rohr.prototype._propFn = function(prop) {
    this._prop = prop;

    if(!_.has(this._object, this._prop)) {
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
}

Rohr.prototype.prop = function(prop) {
    if(this._lastPromise) {
        this._lastPromise = this._lastPromise.then(function(self) {
            return self._propFn(prop);
        });

        return this;
    }

    return this._propFn(prop);
}

Rohr.prototype._optional = function(prop) {
    this._prop = prop;

    if(!_.has(this._object, this._prop)) {
        this._propUndefined = true;
    } else {
        this._propUndefined = false;
    }

    return this;
}

Rohr.prototype.optional = function(prop) {
    if(this._lastPromise) {
        this._lastPromise = this._lastPromise.then(function(self) {
            return self._optional(prop);
        });

        return this;
    }

    return this._optional(prop);
}

Rohr.prototype._set = function(prop, valueFn) {
    this._prop = prop;

    if(_.isFunction(valueFn)) {
        var result = valueFn();
        if(result.then) {
            this._lastPromise = result.then(function(value) {
                this._setProp(value);
                return this;
            }.bind(this))
        } else {
            this._setProp(result);
        }

        return this;
    }

    this._setProp(valueFn);
    return this;
}

Rohr.prototype.set = function(prop, valueFn) {
    if(this._lastPromise) {
        this._lastPromise = this._lastPromise.then(function(self) {
            return self._set(prop, valueFn);
        });

        return this;
    }

    return this._set(prop, valueFn);
}

Rohr.prototype._value = function(valueFn, last) {
    if(!this._prop) {
        throw 'value() called but not inspecting any property';
    }

    if(this._propUndefined) {
        return this;
    }

    if(_.isFunction(valueFn)) {
        var result = valueFn();
        if(result.then) {
            this._lastPromise = result.then(function(value) {
                this._setProp(value);
                return this;
            }.bind(this));

            if(last) {
                return this._lastPromise;
            }
        } else {
            this._setProp(result);
        }

        return this;
    }

    this._setProp(valueFn);
    return this;
}

Rohr.prototype.value = function(valueFn) {
    if(this._lastPromise) {
        this._lastPromise = this._lastPromise.then(function(self) {
            return self._value(valueFn, true);
        });

        return this;
    }

    return this._value(valueFn);
}

Rohr.prototype._nuke = function() {
    if(!this._prop) {
        throw 'nuke() called but not inspecting any property';
    }

    if(this._propUndefined) {
        return this;
    }

    delete this._object[this._prop];
    return this;
}

Rohr.prototype.nuke = function() {
    if(this._lastPromise) {
        this._lastPromise = this._lastPromise.then(function(self) {
            return self._nuke();
        });

        return this;
    }

    return this._nuke();
}

Rohr.prototype._scope = function() {
    if(!this._prop) {
        throw 'scope() called but not inspecting any property';
    }

    if(this._propUndefined) {
        throw 'scope() called but property "' + this._prop + '" is undefined';
    }

    if(!_.isObject(this._getProp())) {
        this._validationErrors.push({
            type: 'InvalidScopeToNonObject',
            property: this._prop,
            scope: this._getScope()
        });

        return this;
    }

    var self = new Rohr(this._getProp());
    self._ancestor = this;
    return self;
}

Rohr.prototype.scope = function() {
    if(this._lastPromise) {
        this._lastPromise = this._lastPromise.then(function(self) {
            return self._scope();
        });

        return this;
    }

    return this._scope();    
}

Rohr.prototype._scopeBack = function () {
    if(this._ancestor) {
        this._ancestor._validationErrors = 
            this._ancestor._validationErrors.concat(this._validationErrors);
        return this._ancestor;
    }

    return this;
}

Rohr.prototype.scopeBack = function() {
    if(this._lastPromise) {
        this._lastPromise = this._lastPromise.then(function(self) {
            return self._scopeBack();
        });

        return this;
    }

    return this._scopeBack();
}

Rohr.prototype._rootScope = function() {
    var self = this;
    while(self._ancestor) {
        self._ancestor._validationErrors = 
            self._ancestor._validationErrors.concat(self._validationErrors);

        self = self._ancestor;
    }

    return self;
}

Rohr.prototype.rootScope = function() {
    if(this._lastPromise) {
        this._lastPromise = this._lastPromise.then(function(self) {
            return self._rootScope();
        });

        return this;
    }

    return this._rootScope();
}

Rohr.prototype._castTo = function(type) {
    if(!this._prop) {
        throw 'castTo() called but not inspecting any property';
    }

    if(this._propUndefined) {
        return this;
    }

    if(type === 'integer') {
        this._transformProp(function(val) {
            return parseInt(val);
        });
    } else if(type === 'float') {
        this._transformProp(function(val) {
            return parseFloat(val);
        });
    } else if(type === 'string') {
        this._transformProp(function(val) {
            return val.toString();
        });
    } else if(type === 'date') {
        this._transformProp(function(val) {
            return new Date(val);
        });
    } else {
        throw 'castTo() encountered unknown type "' + type + '", expected "integer", "float" or "string"';
    }

    return this;
}

Rohr.prototype.castTo = function(type) {
    if(this._lastPromise) {
        this._lastPromise = this._lastPromise.then(function(self) {
            return self._castTo(type);
        });

        return this;
    }

    return this._castTo(type);
}

Rohr.prototype._transform = function(fn, last) {
    var result = fn(this._getProp(), this._object, this._rootScope()._object);

    if(result.then) {
        this._lastPromise = result.then(function(result) {
            this._setProp(result);
            return this;
        }.bind(this), function(err) {
            this._validationErrors.push({
                type: 'TransformPromiseRejected',
                property: this._prop,
                error: err,
                scope: this._getScope()
            });
            return this;  
        }.bind(this));

        if(last) {
            return this._lastPromise;
        }
    } else {
        this._setProp(result);
    }

    return this;
}

Rohr.prototype.transform = function(fn) {
    if(this._lastPromise) {
        this._lastPromise = this._lastPromise.then(function(self) {
            return self._transform(fn, true);
        });

        return this;
    }

    return this._transform(fn);
}

Rohr.prototype._isString = function () {
    if(!this._prop) {
        throw 'isString() called but not inspecting any property';
    }

    if(this._propUndefined) {
        return this;
    }

    if(!_.isString(this._object[this._prop])) {
        this._validationErrors.push({
            type: 'InvalidPropertyType',
            property: this._prop,
            expectedType: 'string',
            actualType: typeof(this._object[this._prop]),
            scope: this._getScope()
        });
    }

    return this;
}

Rohr.prototype.isString = function() {
    if(this._lastPromise) {
        this._lastPromise = this._lastPromise.then(function(self) {
            return self._isString();
        });

        return this;
    }

    return this._isString();
}

Rohr.prototype._isNumber = function() {
    if(!this._prop) {
        throw 'isNumber() called but not inspecting any property';
    }

    if(this._propUndefined) {
        return this;
    }

    if(!_.isNumber(this._object[this._prop])) {
        this._validationErrors.push({
            type: 'InvalidPropertyType',
            property: this._prop,
            expectedType: 'number',
            actualType: typeof(this._object[this._prop]),
            scope: this._getScope()
        });
    }

    return this;
}

Rohr.prototype.isNumber = function() {
    if(this._lastPromise) {
        this._lastPromise = this._lastPromise.then(function(self) {
            return self._isNumber();
        });

        return this;
    }

    return this._isNumber();
}

Rohr.prototype._isArray = function() {
    if(!this._prop) {
        throw 'isArray() called but not inspecting any property';
    }

    if(this._propUndefined) {
        return this;
    }

    if(!_.isArray(this._object[this._prop])) {
        this._validationErrors.push({
            type: 'InvalidPropertyType',
            property: this._prop,
            expectedType: 'array',
            actualType: typeof(this._object[this._prop]),
            scope: this._getScope()
        });
    }

    return this;
}

Rohr.prototype.isArray = function() {
    if(this._lastPromise) {
        this._lastPromise = this._lastPromise.then(function(self) {
            return self._isArray();
        });

        return this;
    }

    return this._isArray();
}

Rohr.prototype._isObject = function() {
    if(!this._prop) {
        throw 'isObject() called but not inspecting any property';
    }

    if(this._propUndefined) {
        return this;
    }

    if(!_.isObject(this._object[this._prop])) {
        this._validationErrors.push({
            type: 'InvalidPropertyType',
            property: this._prop,
            expectedType: 'object',
            actualType: typeof(this._object[this._prop]),
            scope: this._getScope()
        });
    }

    return this;
}

Rohr.prototype.isObject = function() {
    if(this._lastPromise) {
        this._lastPromise = this._lastPromise.then(function(self) {
            return self._isObject();
        });

        return this;
    }

    return this._isObject();
}

Rohr.prototype._isDate = function() {
    if(!this._prop) {
        throw 'isObject() called but not inspecting any property';
    }

    if(this._propUndefined) {
        return this;
    }

    if(!_.isDate(this._object[this._prop])) {
        this._validationErrors.push({
            type: 'InvalidPropertyType',
            property: this._prop,
            expectedType: 'date',
            actualType: typeof(this._object[this._prop]),
            scope: this._getScope()
        });
    }

    return this;
}

Rohr.prototype.isDate = function() {
    if(this._lastPromise) {
        this._lastPromise = this._lastPromise.then(function(self) {
            return self._isDate();
        });

        return this;
    }

    return this._isDate();
}

Rohr.prototype._lookupArray = function(haystack, key) {
    var value = this._getProp();

    var needle = _.find(haystack, function(item) {
        if(!item[key]) {
            return false;
        }

        return item[key] === value;
    });

    if(!needle) {
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
}

Rohr.prototype._lookupObject = function(haystack, key) {
    var needle = haystack[this._getProp()];

    if(!needle) {
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
}

Rohr.prototype._lookup = function(haystack, key) {
    if(!this._prop) {
        throw 'lookup() called but not inspecting any property';
    }

    if(this._propUndefined) {
        return this;
    }

    if(_.isArray(haystack)) {
        return this._lookupArray(haystack, key);
    }

    if(_.isObject(haystack)) {
        return this._lookupObject(haystack, key);
    }

    throw 'lookup() supports "object" and "array", not "' + typeof(haystack) + '"';
}

Rohr.prototype.lookup = function(haystack, key) {
    if(this._lastPromise) {
        this._lastPromise = this._lastPromise.then(function(self) {
            return self._lookup(haystack, key);
        });

        return this;
    }

    return this._lookup(haystack, key);
}

Rohr.prototype._map = function(fn) {
    if(!this._prop) {
        throw 'lookup() called but not inspecting any property';
    }

    if(this._propUndefined) {
        return this;
    }

    if(!_.isArray(this._getProp())) {
        this._validationErrors.push({
            type: 'MapOverNonArray',
            property: this._prop,
            propertyType: typeof(this._getProp()),
            scope: this._getScope()
        });
    }

    this._lastPromise = Promise.all(_.map(this._getProp(), function(value) {
        var result = fn(value);
        if(result.then) {
            return result;
        } else {
            return Promise.resolve(result);
        }
    })).then(function(array) {
        this._setProp(array);
        return this;
    }.bind(this));

    return this;
}

Rohr.prototype.map = function(fn) {
    if(this._lastPromise) {
        this._lastPromise = this._lastPromise.then(function(self) {
            return self._map(fn);
        });

        return this;
    }

    return this._map(fn);
}

Rohr.prototype._rename = function(name) {
    if(!this._prop) {
        throw 'rename() called but not inspecting any property';
    }

    if(this._propUndefined) {
        return this;
    }

    var prop = this._prop;
    var value = this._getProp();

    delete this._object[this._prop];
    this._prop = name;
    this._setProp(value);
    return this;
}

Rohr.prototype.rename = function(name) {
    if(this._lastPromise) {
        this._lastPromise = this._lastPromise.then(function(self) {
            return self._rename(name);
        });

        return this;
    }

    return this._rename(name);   
}

Rohr.prototype._rescope = function(path) {
    if(!this._prop) {
        throw 'rescope() called but not inspecting any property';
    }

    if(this._propUndefined) {
        return this;
    }

    var value = this._getProp();

    var pathItems = path.split('.');
    pathItems.reverse();

    var scope = this._rootScope();
    while(pathItems.length > 0) {
        var key = pathItems.pop();

        if(!scope._object[key] || !_.isObject(scope._object)) {
            scope._object[key] = {};
        }

        var newScope = new Rohr(scope._object[key]);
        newScope._ancestor = scope;
        scope = newScope;
    }

    scope._prop = this._prop;
    scope._setProp(value);

    delete this._object[this._prop];
    this._propUndefined = true;
    return scope;
}

Rohr.prototype.rescope = function(path) {
    if(this._lastPromise) {
        this._lastPromise = this._lastPromise.then(function(self) {
            return self._rescope(path);
        });

        return this;
    }

    return this._rescope(path);
}

Rohr.prototype._broadcast = function(fields) {
    if(!this._prop) {
        throw 'broadcast() called but not inspecting any property';
    }

    if(this._propUndefined) {
        return this;
    }

    if(!_.isArray(fields)) {
        fields = [fields];
    }

    var value = this._getProp();

    _.each(fields, function(field) {
        this._object[field] = value;
    }.bind(this));

    return this;
}

Rohr.prototype.broadcast = function(fields) {
    if(this._lastPromise) {
        this._lastPromise = this._lastPromise.then(function(self) {
            return self._broadcast(fields);
        });

        return this;
    }

    return this._broadcast(fields);
}

module.exports = Rohr;
