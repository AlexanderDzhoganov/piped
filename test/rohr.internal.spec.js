var should = require('should');
var rohr = require('./../lib/rohr');

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

    
});
