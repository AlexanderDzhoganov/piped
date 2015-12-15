var should = require('should');

var piped = require('./../lib/piped');

describe('piped', function() {
    describe('constructor', function() {
        it('should create a new piped object', function() {
            var instance = piped({foo: 'bar'});
            instance._object.foo.should.equal('bar');
        });
    });
});