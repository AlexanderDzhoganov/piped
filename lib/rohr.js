var _ = require('lodash');

var Rohr = function(object) {
    this._object = object;
    this._prop = null;
    this._propUndefined = false;
    this._lastPromise = null;
    this._ancestor = null;
    this._validationErrors = [];

    this._getProp = function() {
        return this._object[this._prop];
    }

    this._setProp = function(value) {
        this._object[this._prop] = value;
    }

    this._transformProp = function(fn) {
        this._setProp(fn(this._getProp()));
    }

    this._rootScope = function() {
        var self = this;
        while(self._ancestor) {
            self = self._ancestor;
        }

        return self;
    }

    this._getScope = function() {
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

    this._toPromise = function(rejectOnValidationError) {
        if(!rejectOnValidationError || this._validationErrors.length === 0) {
            return Promise.resolve(this._object);
        } else {
            return Promise.reject(this._validationErrors);
        }
    }

    this.toPromise = function() {
        if(this._lastPromise) {
            return this._lastPromise.then(function(self) {
                return self._toPromise();
            });
        }

        return this._toPromise();
    }

    this._resolve = function() {
        return Promise.resolve(this._object);
    }

    this.resolve = function() {
        if(this._lastPromise) {
            return this._lastPromise.then(function(self) {
                return self._resolve();
            });
        }

        return this._resolve();
    }

    this._objectFn = function(fn) {
        fn(this._object);
        return this;
    }

    this.object = function(fn) {
        if(this._lastPromise) {
            this._lastPromise = this._lastPromise.then(function(self) {
                return self._objectFn(fn);
            });

            return this;
        }

        return this._objectFn(fn);
    }

    this._error = function(fn) {
        fn(this._validationErrors);
        return this;
    }

    this.error = function(fn) {
        if(this._lastPromise) {
            this._lastPromise = this._lastPromise.then(function(self) {
                return self._error(fn);
            });

            return this;
        }

        return this._error(fn);
    }

    this._propFn = function(prop) {
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

    this.prop = function(prop) {
        if(this._lastPromise) {
            this._lastPromise = this._lastPromise.then(function(self) {
                return self._propFn(prop);
            });

            return this;
        }

        return this._propFn(prop);
    }

    this._optional = function(prop) {
        this._prop = prop;

        if(!_.has(this._object, this._prop)) {
            this._propUndefined = true;
        } else {
            this._propUndefined = false;
        }

        return this;
    }

    this.optional = function(prop) {
        if(this._lastPromise) {
            this._lastPromise = this._lastPromise.then(function(self) {
                return self._optional(prop);
            });

            return this;
        }

        return this._optional(prop);
    }

    this._set = function(prop, valueFn) {
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

    this.set = function(prop, valueFn) {
        if(this._lastPromise) {
            this._lastPromise = this._lastPromise.then(function(self) {
                return self._set(prop, valueFn);
            });

            return this;
        }

        return this._set(prop, valueFn);
    }

    this._nuke = function() {
        if(!this._prop) {
            throw 'nuke() called but not inspecting any property';
        }

        if(this._propUndefined) {
            return this;
        }

        delete this._object[this._prop];
        return this;
    }

    this.nuke = function() {
        if(this._lastPromise) {
            this._lastPromise = this._lastPromise.then(function(self) {
                return self._nuke();
            });

            return this;
        }

        return this._nuke();
    }

    this._scope = function() {
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

    this.scope = function() {
        if(this._lastPromise) {
            this._lastPromise = this._lastPromise.then(function(self) {
                return self._scope();
            });

            return this;
        }

        return this._scope();    
    }

    this._scopeback = function () {
        if(this._ancestor) {
            this._ancestor._validationErrors = 
                this._ancestor._validationErrors.concat(this._validationErrors);
            return this._ancestor;
        }

        return this;
    }

    this.scopeBack = function() {
        if(this._lastPromise) {
            this._lastPromise = this._lastPromise.then(function(self) {
                return self._scopeBack();
            });

            return this;
        }

        return this._scopeBack();
    }

    this._rootScope = function() {
        var self = this;
        while(self._ancestor) {
            self._ancestor._validationErrors = 
                self._ancestor._validationErrors.concat(self._validationErrors);

            self = self._ancestor;
        }

        return self;
    }

    this.rootScope = function() {
        if(this._lastPromise) {
            this._lastPromise = this._lastPromise.then(function(self) {
                return self._rootScope();
            });

            return this;
        }

        return this._rootScope();
    }

    this._castTo = function(type) {
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

    this.castTo = function(type) {
        if(this._lastPromise) {
            this._lastPromise = this._lastPromise.then(function(self) {
                return self._castTo(type);
            });

            return this;
        }

        return this._castTo(type);
    }

    this._transform = function(fn, last) {
        var result = fn(this._getProp());

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

    this.transform = function(fn) {
        if(this._lastPromise) {
            this._lastPromise = this._lastPromise.then(function(self) {
                return self._transform(fn, true);
            });

            return this;
        }

        return this._transform(fn);
    }

    this._isString = function () {
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

    this.isString = function() {
        if(this._lastPromise) {
            this._lastPromise = this._lastPromise.then(function(self) {
                return self._isString();
            });

            return this;
        }

        return this._isString();
    }

    this._isNumber = function() {
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

    this.isNumber = function() {
        if(this._lastPromise) {
            this._lastPromise = this._lastPromise.then(function(self) {
                return self._isNumber();
            });

            return this;
        }

        return this._isNumber();
    }

    this._isArray = function() {
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

    this.isArray = function() {
        if(this._lastPromise) {
            this._lastPromise = this._lastPromise.then(function(self) {
                return self._isArray();
            });

            return this;
        }

        return this._isArray();
    }

    this._isObject = function() {
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

    this.isObject = function() {
        if(this._lastPromise) {
            this._lastPromise = this._lastPromise.then(function(self) {
                return self._isObject();
            });

            return this;
        }

        return this._isObject();
    }

    this._isDate = function() {
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

    this.isDate = function() {
        if(this._lastPromise) {
            this._lastPromise = this._lastPromise.then(function(self) {
                return self._isDate();
            });

            return this;
        }

        return this._isDate();
    }

    this._lookupArray = function(haystack, key) {
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

    this._lookupObject = function(haystack, key) {
        return this;
    }

    this._lookup = function(haystack, key) {
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

    this.lookup = function(haystack, key) {
        if(this._lastPromise) {
            this._lastPromise = this._lastPromise.then(function(self) {
                return self._lookup(haystack, key);
            });

            return this;
        }

        return this._lookup(haystack, key);
    }

    this._rename = function(name) {
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

    this.rename = function(name) {
        if(this._lastPromise) {
            this._lastPromise = this._lastPromise.then(function(self) {
                return self._rename(name);
            });

            return this;
        }

        return this._rename(name);   
    }

    this._rescope = function(path) {
        if(!this._prop) {
            throw 'rescope() called but not inspecting any property';
        }

        if(this._propUndefined) {
            return this;
        }

        if(!_.contains(path, '.')) {
            return this.rename(path);
        }

        var pathItems = path.split('.');
        pathItems.reverse();

        var rootScope = this._rootScope();
        while(pathItems.length > 0) {
            var key = pathItems.pop();

            if(!rootScope._object[key]) {
                rootScope._object[key] = {};
            } else if(!_.isObject(rootScope._object)) {
                this._validationErrors.push({
                    type: 'RescopeToNonObject',
                    property: this._prop,
                    rescopePath: path,
                    scope: this._getScope()
                });

                return this;
            } 

            var newScope = new Rohr(rootScope._object[key]);
            newScope._ancestor = rootScope;
            rootScope = newScope;
        }

        rootScope._prop = this._prop;
        rootScope._setProp(this._getProp());

        delete this._object[this._prop];
        this._propUndefined = true;
        return rootScope;
    }

    this.rescope = function(path) {
        if(this._lastPromise) {
            this._lastPromise = this._lastPromise.then(function(self) {
                return self._rescope(path);
            });

            return this;
        }

        return this._rescope(path);
    }
}

module.exports = function(object) {
    return new Rohr(object);
}