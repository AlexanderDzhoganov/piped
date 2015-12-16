var should = require('should');
var rohr = require('./../index');

describe('rohr.internal', function() {
    describe('_transformProp()', function() {
        it('test #1', function() {
            var i = rohr({ test: 1 }).prop('test');

            i._transformProp(function(val) {
                return val + 1;
            });

            i.toPromise().then(function(object) {
                object.test.should.equal(2);
            });
        });
    });

    describe('_rootScope()', function() {
        it('test #1', function() {
            return rohr({ test: 2 })._rootScope().prop('test')

            .toPromise().then(function(object) {
                object.test.should.equal(2);
            });
        });

        it('test #2', function() {
            return rohr({ test: 2, foo: { bar: { baz: 1 } } })

            .prop('foo').scope()
                .prop('bar').scope()

            ._rootScope().prop('test')

            .toPromise().then(function(object) {
                object.test.should.equal(2);
            });
        });
    });

    describe('_getScope()', function() {
        it('test #1', function() {
            return rohr({ test: 2 }).prop('test')
            ._getScope().should.equal('');
        });

        it('test #2', function() {
            return rohr({ test: { foo: 'bar' } }).prop('test').scope()
            ._getScope().should.equal('test');
        });

    });

});
