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
    });

    describe('object()', function() {
        it('should return the validation errors', function() {
            return rohr({foo: 'bar'})

            .prop('foo').isNumber()

            .error(function(errors) {
                errors.length.should.equal(1);
            })

            .resolve();
        });
    });

    describe('prop()', function() {
        it('test 1 (passing)', function() {
            return rohr({foo: 'bar'})
                .prop('foo');
        });

        it('test 2 (failing)', function() {
            return rohr({foo: 'bar'})
                .prop('notFound')
            .toPromise().then(function() {
                return Promise.reject();
            }, function() {
                return Promise.resolve();
            });
        });
    });

    describe('optional()', function() {
        it('test 1 (passing)', function() {
            return rohr({foo: 'bar'})
                .optional('foo').transform(function(value) {
                    return 'test';
                })

                .toPromise().then(function(object) {
                    object.foo.should.equal('test');
                });
        });

        it('test 2 (failing)', function() {
            return rohr({foo: 'bar'})
                .optional('notFound')
            .toPromise();
        });
    });

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

    describe('isNumber()', function() {
        it('test 1 (passing)', function() {
            return rohr({foo: 4})

            .prop('foo').isNumber()

            .toPromise();
        });

        it('test 2 (failing)', function() {
            return rohr({foo: 'bar'})

            .prop('foo').isNumber()

            .toPromise().then(function() {
                return Promise.reject();
            }).catch(function() {
                return Promise.resolve();
            });
        });
    });

    describe('isObject()', function() {
        it('test 1 (passing)', function() {
            return rohr({foo: {}})

            .prop('foo').isObject()

            .toPromise();
        });

        it('test 2 (failing)', function() {
            return rohr({foo: 'bar'})

            .prop('foo').isObject()

            .toPromise().then(function() {
                return Promise.reject();
            }).catch(function() {
                return Promise.resolve();
            });
        });
    });

    describe('isDate()', function() {
        it('test 1 (passing)', function() {
            return rohr({foo: new Date(Date.now())})

            .prop('foo').isDate()

            .toPromise();
        });

        it('test 2 (failing)', function() {
            return rohr({foo: 'bar'})

            .prop('foo').isDate()

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

    describe('value()', function() {
        it('should set a property (sync value)', function() {
            return rohr({ foo: 1234 }).prop('foo').value('bar').toPromise().then(function(object) {
                object.foo.should.equal('bar');
            });
        });

        it('should set a property (sync function)', function() {
            return rohr({ foo: 1234 }).prop('foo').value(function() {
                return 'bar';
            }).toPromise().then(function(object) {
                object.foo.should.equal('bar');
            });
        });

        it('should set a property (async function)', function() {
            return rohr({ foo: 1234 }).prop('foo').value(function() {
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
        });
    });

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

    describe('scope()', function() {
        it('single scope', function() {
            return rohr({foo: { bar: 'baz' }})

            .prop('foo').scope()
                .prop('bar').isString().transform(function(value) {
                    value.should.equal('baz');
                    return value;
                })
            .scopeBack()

            .toPromise().then(function(object) {
                object.foo.bar.should.equal('baz');
            });
        });

        it('nested scopes', function() {
            return rohr({foo: { bar: { baz: 420 } }})

            .prop('foo').isObject().scope()
                .prop('bar').isObject().scope()
                    .prop('baz').isNumber().transform(function(value) {
                        value.should.equal(420);
                        return new Promise(function(resolve, reject) {
                            setTimeout(function() {
                                resolve(value * 2);
                            }, 25);
                        });
                    })
                .scopeBack()
            .scopeBack()

            .toPromise().then(function(object) {
                object.foo.bar.baz.should.equal(840);
            });
        });
    });

    describe('map()', function() {
        it('sync test', function() {
            return rohr({ test: [1, 2, 3, 4]})
            
            .prop('test').isArray().map(function(value) {
                return value * 2;
            })

            .toPromise().then(function(object) {
                object.test.length.should.equal(4);
                object.test[0].should.equal(2);
                object.test[1].should.equal(4);
                object.test[2].should.equal(6);
                object.test[3].should.equal(8);
            });
        });

        it('async test', function() {
            return rohr({ test: [1, 2, 3, 4]})
            
            .prop('test').isArray().map(function(value) {
                return new Promise(function(resolve, reject) {
                    setTimeout(function() {
                        resolve(value * 2);
                    }, 20);
                });
            })

            .toPromise().then(function(object) {
                object.test.length.should.equal(4);
                object.test[0].should.equal(2);
                object.test[1].should.equal(4);
                object.test[2].should.equal(6);
                object.test[3].should.equal(8);
            });
        });

        it('async test (randomized)', function() {
            return rohr({ test: [1, 2, 3, 4]})
            
            .prop('test').isArray().map(function(value) {
                return new Promise(function(resolve, reject) {
                    setTimeout(function() {
                        resolve(value * 2);
                    }, Math.random() * 20);
                });
            })

            .toPromise().then(function(object) {
                object.test.length.should.equal(4);
                object.test[0].should.equal(2);
                object.test[1].should.equal(4);
                object.test[2].should.equal(6);
                object.test[3].should.equal(8);
            });
        });

        it('mix sync/async test', function() {
            return rohr({ test: [1, 2, 3, 4]})
            
            .prop('test').isArray().map(function(value) {
                if(value % 2 == 0) {                
                    return new Promise(function(resolve, reject) {
                        setTimeout(function() {
                            resolve(value * 2);
                        }, 20);
                    });
                } else {
                    return value * 2;
                }
            })

            .toPromise().then(function(object) {
                object.test.length.should.equal(4);
                object.test[0].should.equal(2);
                object.test[1].should.equal(4);
                object.test[2].should.equal(6);
                object.test[3].should.equal(8);
            });
        });
    });

    describe('broadcast()', function() {
        it('should broadcast a value to a single field', function() {
            return rohr({ foo: 1234 })

            .prop('foo').broadcast('bar')

            .toPromise().then(function(object) {
                object.bar.should.equal(1234);
            });
        });

        it('should broadcast a value to multiple fields', function() {
            return rohr({ foo: 1234 })
            
            .prop('foo').broadcast(['bar', 'baz', 'test'])

            .toPromise().then(function(object) {
                object.bar.should.equal(1234);
                object.baz.should.equal(1234);
                object.test.should.equal(1234);
            });
        });
    });
});
