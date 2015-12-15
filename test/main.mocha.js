var should = require('should');

var rohr = require('./../lib/rohr');

describe('rohr', function() {
    describe('constructor', function() {
        it('should create a new rohr object', function() {
            var instance = rohr({foo: 'bar'});
            instance._object.foo.should.equal('bar');
        });
    });

    describe('object()', function() {
        it('should return the object', function() {
            return rohr({foo: 'bar'}).object(function(object) {
                object.foo.should.equal('bar');
            }).resolve();
        });
    })

    describe('object()', function() {
        it('should return the validation errors', function() {
            return rohr({foo: 'bar'})

            .prop('foo').isNumber()

            .error(function(errors) {
                errors.length.should.equal(1);
            })

            .resolve();
        });
    })

    describe('isString()', function() {
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
    });

    describe('nuke()', function() {
        it('should remove a property', function() {
            return rohr({foo: 'bar'})

            .prop('foo').nuke()

            .toPromise().then(function(object) {
                if(object.foo) {
                    return Promise.reject();
                }
            });
        });
    });

    describe('set()', function() {
        it('should set a property (sync value)', function() {
            return rohr({}).set('foo', 'bar').toPromise().then(function(object) {
                object.foo.should.equal('bar');
            });
        });

        it('should set a property (sync function)', function() {
            return rohr({}).set('foo', function() {
                return 'bar';
            }).toPromise().then(function(object) {
                object.foo.should.equal('bar');
            });
        });

        it('should set a property (async function)', function() {
            return rohr({}).set('foo', function() {
                return new Promise(function(resolve, reject) { 
                    setTimeout(function() {
                        resolve('bar');
                    }, 20);
                });
            }).toPromise().then(function(object) {
                object.foo.should.equal('bar');
            });
        });
    });

    describe('rename()', function() {
        it('should rename a property #1', function() {
            return rohr({foo: 'bar'})

            .prop('foo').rename('baz')

            .toPromise().then(function(object) {
                object.baz.should.equal('bar');
            });
        })

        it('should rename a property #2', function() {
            return rohr({foo: 'bar'})

            .prop('foo').transform(function(val) {
                return 'hello';
            }).rename('test')

            .toPromise().then(function(object) {
                object.test.should.equal('hello');
            });
        });

        it('with scope()', function() {
            return rohr({foo: 'bar'})

            .prop('foo').transform(function(val) {
                return { hello: 'world' };
            }).rename('test').scope()
                .prop('hello').isString()

            .rootScope()

            .toPromise().then(function(object) {
                object.test.hello.should.equal('world');
            });
        })

        it('with scope() (async)', function() {
            return rohr({foo: 'bar'})

            .prop('foo').transform(function(val) {
                return new Promise(function(resolve, reject) {
                    setTimeout(function() {
                        resolve({ hello: 'world' })
                    }, 50);
                });
            }).rename('test').scope()
                .prop('hello').isString()

            .rootScope()

            .toPromise().then(function(object) {
                object.test.hello.should.equal('world');
            });
        })

        it('with scope() (async) #2', function() {
            return rohr({foo: 'bar'})

            .prop('foo').isString().rename('test').transform(function(val) {
                return new Promise(function(resolve, reject) {
                    setTimeout(function() {
                        resolve({ hello: 'world', nuked: true })
                    }, 50);
                });
            }).scope()
                .prop('hello').isString()
                .prop('nuked').nuke()

            .rootScope()

            .toPromise().then(function(object) {
                object.test.hello.should.equal('world');
                if(object.test.nuked) {
                    return Promise.reject();
                }
            });
        })
    })

    describe('transform()', function() {
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
                    }, 20);
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
                    }, 20);
                });
            })

            .toPromise().then(function(object) {
                object.foo.should.equal('baz');
                object.test.should.equal(2468);
            });
        });

    });
});