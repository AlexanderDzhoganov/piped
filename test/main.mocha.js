var should = require('should');

var rohr = require('./../lib/rohr');

describe('rohr', function() {
    describe('constructor', function() {
        it('should create a new rohr object', function() {
            var instance = rohr({foo: 'bar'});
            instance._object.foo.should.equal('bar');
        });
    });
});