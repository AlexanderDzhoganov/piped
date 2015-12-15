var should = require('should');

var rohr = require('./../lib/rohr');

describe('rohr', function() {
    describe('constructor', function() {
        it('should create a new rohr object', function() {
            var instance = rohr({foo: 'bar'});
            instance._object.foo.should.equal('bar');
        });
    });

    describe('isString', function() {
        it('test 1 (passing)', function() {
            return rohr({foo: 'bar'})

            .prop('foo').isString()

            .toPromise();
        });

        it('test 2 (failing)', function() {
            return rohr({foo: 1234})

            .prop('foo').isString()

            .toPromise().then(function() {
                return Promise.reject();
            }).catch(function() {
                return Promise.resolve();
            });
        });
    })

    describe('rename', function() {
        it('test 1', function() {
            return rohr({foo: 'bar'})

            .prop('foo').rename('baz')

            .toPromise().then(function(object) {
                object.baz.should.equal('bar');
            });
        })

        it('test 2', function() {
            return rohr({foo: 'bar'})

            .prop('foo').transform(function(val) {
                return 'hello';
            }).rename('test')

            .toPromise().then(function(object) {
                object.test.should.equal('hello');
            });
        });
    })

    describe('transform', function() {
        it('w/ synchronous return value', function() {
            return rohr({foo: 'bar'})

            .prop('foo').transform(function(val) {
                return 'baz';
            }).toPromise().then(function(object) {
                object.foo.should.equal('baz');
            });
        });

        it('w/ asynchronous return value', function() {
            return rohr({foo: 'bar'})

            .prop('foo').transform(function(val) {
                return new Promise(function(resolve, reject) {
                    setTimeout(function() {
                        resolve('hello');
                    }, 50);
                });
            }).transform(function(val) {
                return new Promise(function(resolve, reject) {
                    setTimeout(function() {
                        resolve('baz');
                    }, 25);
                });
            })

            .toPromise().then(function(object) {
                object.foo.should.equal('baz');
            });
        });

        it('w/ asynchronous return value #2', function() {
            return rohr({foo: 'bar', test: 1234})

            .prop('foo').isString().transform(function(val) {
                return new Promise(function(resolve, reject) {
                    setTimeout(function() {
                        resolve('baz');
                    }, 25);
                });
            })

            .prop('test').isNumber().transform(function(val) {
                return new Promise(function(resolve, reject) {
                    setTimeout(function() {
                        resolve(val * 2);
                    }, 40);
                });
            })

            .toPromise().then(function(object) {
                object.foo.should.equal('baz');
                object.test.should.equal(2468);
            });
        });

    });
});