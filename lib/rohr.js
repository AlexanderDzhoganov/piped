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

    this.resolve = function(fn) {
        if(!this._lastPromise) {
            return fn(this._object, this._validationErrors);
        }

        return this._lastPromise.then(function(self) {
            return fn(self._object, this._validationErrors);
        });
    }

    this.toPromise = function() {
        if(!this._lastPromise) {
            if(this._validationErrors.length === 0) {
                return Promise.resolve(this._object);
            } else {
                return Promise.reject(this._validationErrors);
            }
        } else {
            return this._lastPromise.then(function(self) {
                if(self._validationErrors.length === 0) {
                    return Promise.resolve(self._object);
                }

                return Promise.reject(this._validationErrors);
            });
        }
    }

    this.prop = function(prop) {
        if(this._lastPromise) {
            this._lastPromise = this._lastPromise.then(function(self) {
                self._lastPromise = null;
                return self.prop(prop);
            });

            return this;
        }

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

    this.scope = function() {
        if(this._lastPromise) {
            this._lastPromise = this._lastPromise.then(function(self) {
                self._lastPromise = null;
                return self.scope(prop);
            });

            return this;
        }

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

    this.scopeBack = function() {
        if(this._ancestor) {
            this._ancestor._validationErrors = 
                this._ancestor._validationErrors.concat(this._validationErrors);
            return this._ancestor;
        }

        return this;
    }

    this.rootScope = function() {
        var self = this;
        while(self._ancestor) {
            self._ancestor._validationErrors = 
                self._ancestor._validationErrors.concat(self._validationErrors);

            self = self._ancestor;
        }

        return self;
    }

    this.castTo = function(type) {
        if(this._lastPromise) {
            this._lastPromise = this._lastPromise.then(function(self) {
                self._lastPromise = null;
                return self.castTo(type);
            });

            return this;
        }

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
        else if(type === 'date') {
            this._transformProp(function(val) {
                return new Date(val);
            });
        } else {
            throw 'castTo() encountered unknown type "' + type + '", expected "integer", "float" or "string"';
        }

        return this;
    }

    this.transform = function(fn) {
        if(this._lastPromise) {
            this._lastPromise = this._lastPromise.then(function(self) {
                self._lastPromise = null;
                return self.transform(fn);
            });

            return this;
        }

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
        } else {
            this._setProp(result);
        }

        return this;
    }

    this.isString = function() {
        if(this._lastPromise) {
            this._lastPromise = this._lastPromise.then(function(self) {
                self._lastPromise = null;
                return self.isString();
            });

            return this;
        }

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

    this.isNumber = function() {
        if(this._lastPromise) {
            this._lastPromise = this._lastPromise.then(function(self) {
                self._lastPromise = null;
                return self.isNumber();
            });

            return this;
        }

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

    this.isArray = function() {
        if(this._lastPromise) {
            this._lastPromise = this._lastPromise.then(function(self) {
                self._lastPromise = null;
                return self.isArray();
            });

            return this;
        }

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

    this.isObject = function() {
        if(this._lastPromise) {
            this._lastPromise = this._lastPromise.then(function(self) {
                self._lastPromise = null;
                return self.isObject();
            });

            return this;
        }

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

    this.isDate = function() {
        if(this._lastPromise) {
            this._lastPromise = this._lastPromise.then(function(self) {
                self._lastPromise = null;
                return self.isObject();
            });

            return this;
        }

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

    this.lookup = function(haystack, key) {
        if(this._lastPromise) {
            this._lastPromise = this._lastPromise.then(function(self) {
                self._lastPromise = null;
                return self.lookup(haystack, key);
            });

            return this;
        }

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

    this.rename = function(name) {
        if(this._lastPromise) {
            this._lastPromise = this._lastPromise.then(function(self) {
                self._lastPromise = null;
                return self.rename(haystack, key);
            });

            return this;
        }

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

    this.rescope = function(path) {
        if(this._lastPromise) {
            this._lastPromise = this._lastPromise.then(function(self) {
                self._lastPromise = null;
                return self.rescope(path);
            });

            return this;
        }

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
}

module.exports = function(object) {
    return new Rohr(object);
}