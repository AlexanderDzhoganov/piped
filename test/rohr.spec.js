var should = require('should');
var rohr = require('./../index');

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
 
        it('should return the object #2', function() {
            return rohr({foo: 'bar'}).prop('foo').transform(function(val) {
                return new Promise(function(resolve, reject) {
                    setTimeout(function() {
                        resolve('abc');
                    }, 15);
                })
            }).object(function(object) {
                object.foo.should.equal('abc');
            }).resolve();
        });

        it('should return the validation errors', function() {
            return rohr({foo: 'bar'})

            .prop('foo').isNumber()

            .error(function(errors) {
                errors.length.should.equal(1);
            })

            .resolve();
        });
    });

    describe('error()', function() {
        it('should return no errors', function() {
            return rohr({foo: 'bar'}).object(function(object) {
                object.foo.should.equal('bar');
            }).error(function(err) {
                err.length.should.equal(0);
            }).resolve();
        });

        it('should return the validation errors', function() {
            return rohr({foo: 'bar'})

            .prop('foo').isNumber()

            .error(function(errors) {
                errors.length.should.equal(1);
            })

            .resolve();
        });

        it('should return the validation errors #2', function() {
            return rohr({foo: 4})

            .prop('foo').transform(function(val) {
                return new Promise(function(resolve, reject) {
                    setTimeout(function() {
                        resolve('abc');
                    }, 15);
                })
            }).isNumber()

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

        it('should do nothing while matchStatus === false', function() {
            return rohr({foo: 'bar', 'test': 1234})
            .prop('foo').ifEquals('42')
                .prop('test').value(36)
            .endIf()

            .toPromise().then(function(object) {
                object.test.should.equal(1234);
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

        it('test 3 (passing)', function() {
            return rohr({foo: 'bar', i: 1}).prop('i').transform(function(value) {
                return new Promise(function(resolve, reject) {
                    setTimeout(function() {
                        resolve(value + 11);
                    }, 10);
                });
            })
            .optional('foo').transform(function(value) {
                return 'test';
            })

            .toPromise().then(function(object) {
                object.foo.should.equal('test');
                object.i.should.equal(12);
            });
        });

        it('should do nothing while matchStatus === false', function() {
            return rohr({foo: 'bar', 'test': 1234})
            .prop('foo').ifEquals('42')
                .optional('test').value(36)
            .endIf()

            .toPromise().then(function(object) {
                object.test.should.equal(1234);
            });
        });
    });

    describe('isString()', function() {
        it('test 1 (passing)', function() {
            return rohr({foo: 'bar'})

            .prop('foo').isString()
            .optional('hello').isString()

            .toPromise();
        });

        it('test #2 (passing)', function() {
            return rohr({foo: 12})

            .prop('foo').transform(function(val) {
                return new Promise(function(resolve, reject) {
                    setTimeout(function() {
                        resolve('1234');
                    }, 10);
                });
            }).isString()
            .optional('hello').isString()

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

        it('without selected property', function() {
            try {
                rohr({foo: 1234}).isString()
                should.fail();
            } catch (err) {
                return Promise.resolve();
            }
        });

        it('should do nothing while matchStatus === false', function() {
            return rohr({foo: 'bar', 'test': 1234})
            .prop('foo').ifEquals('42')
                .prop('test').isString()
            .endIf()

            .toPromise().then(function(object) {
                object.test.should.equal(1234);
            });
        });
    });

    describe('isNumber()', function() {
        it('test #1 (passing)', function() {
            return rohr({foo: 4})

            .prop('foo').isNumber()
            .optional('hello').isNumber()

            .toPromise();
        });

        it('test #2 (passing)', function() {
            return rohr({foo: 'bla'})

            .prop('foo').transform(function(val) {
                return new Promise(function(resolve, reject) {
                    setTimeout(function() {
                        resolve(1234);
                    }, 10);
                });
            }).isNumber()
            .optional('hello').isNumber()

            .toPromise();
        });

        it('test #3 (failing)', function() {
            return rohr({foo: 'bar'})

            .prop('foo').isNumber()

            .toPromise().then(function() {
                return Promise.reject();
            }).catch(function() {
                return Promise.resolve();
            });
        });

        it('without selected property', function() {
            try {
                rohr({foo: 1234}).isNumber()
                should.fail();
            } catch (err) {
                return Promise.resolve();
            }
        });

        it('should do nothing while matchStatus === false', function() {
            return rohr({foo: 'bar', 'test': 'hello world'})
            .prop('foo').ifEquals('42')
                .prop('test').isNumber()
            .endIf()

            .toPromise().then(function(object) {
                object.test.should.equal('hello world');
            });
        });
    });

    describe('isBoolean()', function() {
        it('test #1 (passing)', function() {
            return rohr({foo: true})

            .prop('foo').isBoolean()
            .optional('hello').isBoolean()

            .toPromise();
        });

        it('test #2 (passing)', function() {
            return rohr({foo: 'bla'})

            .prop('foo').transform(function(val) {
                return new Promise(function(resolve, reject) {
                    setTimeout(function() {
                        resolve(true);
                    }, 10);
                });
            }).isBoolean()
            .optional('hello').isBoolean()

            .toPromise();
        });

        it('test #3 (failing)', function() {
            return rohr({foo: 'bar'})

            .prop('foo').isBoolean()

            .toPromise().then(function() {
                return Promise.reject();
            }).catch(function() {
                return Promise.resolve();
            });
        });

        it('without selected property', function() {
            try {
                rohr({foo: 1234}).isBoolean()
                should.fail();
            } catch (err) {
                return Promise.resolve();
            }
        });

        it('should do nothing while matchStatus === false', function() {
            return rohr({foo: 'bar', 'test': 'hello world'})
            .prop('foo').ifEquals('42')
                .prop('test').isBoolean()
            .endIf()

            .toPromise().then(function(object) {
                object.test.should.equal('hello world');
            });
        });
    });

    describe('isObject()', function() {
        it('test #1 (passing)', function() {
            return rohr({foo: {}})

            .prop('foo').isObject()
            .optional('hello').isObject()

            .toPromise();
        });

        it('test #2 (passing)', function() {
            return rohr({foo: 'bla'})

            .prop('foo').transform(function(val) {
                return new Promise(function(resolve, reject) {
                    setTimeout(function() {
                        resolve({abc: 123});
                    }, 10);
                });
            }).isObject()
            .optional('hello').isObject()

            .toPromise();
        });

        it('test #3 (failing)', function() {
            return rohr({foo: 'bar'})

            .prop('foo').isObject()

            .toPromise().then(function() {
                return Promise.reject();
            }).catch(function() {
                return Promise.resolve();
            });
        });

        it('without selected property', function() {
            try {
                rohr({foo: 1234}).isObject()
                should.fail();
            } catch (err) {
                return Promise.resolve();
            }
        });

        it('should do nothing while matchStatus === false', function() {
            return rohr({foo: 'bar', 'test': 'hello world'})
            .prop('foo').ifEquals('42')
                .prop('test').isObject()
            .endIf()

            .toPromise().then(function(object) {
                object.test.should.equal('hello world');
            });
        });
    });

    describe('isDate()', function() {
        it('test #1 (passing)', function() {
            return rohr({foo: new Date(Date.now())})

            .prop('foo').isDate()
            .optional('hello').isDate()

            .toPromise();
        });

        it('test #2 (passing)', function() {
            return rohr({foo: 'bla'})

            .prop('foo').transform(function(val) {
                return new Promise(function(resolve, reject) {
                    setTimeout(function() {
                        resolve(new Date(Date.now()));
                    }, 10);
                });
            }).isDate()
            .optional('hello').isDate()

            .toPromise();
        });

        it('test #3 (failing)', function() {
            return rohr({foo: 'bar'})

            .prop('foo').isDate()

            .toPromise().then(function() {
                return Promise.reject();
            }).catch(function() {
                return Promise.resolve();
            });
        });

        it('without selected property', function() {
            try {
                rohr({foo: 1234}).isDate()
                should.fail();
            } catch (err) {
                return Promise.resolve();
            }
        });

        it('should do nothing while matchStatus === false', function() {
            return rohr({foo: 'bar', 'test': 'hello world'})
            .prop('foo').ifEquals('42')
                .prop('test').isDate()
            .endIf()

            .toPromise().then(function(object) {
                object.test.should.equal('hello world');
            });
        });
    });

    describe('isArray()', function() {
        it('test #1 (passing)', function() {
            return rohr({foo: [1, 2]})

            .prop('foo').isArray()
            .optional('hello').isArray()

            .toPromise();
        });

        it('test #2 (passing)', function() {
            return rohr({foo: 'bla'})

            .prop('foo').transform(function(val) {
                return new Promise(function(resolve, reject) {
                    setTimeout(function() {
                        resolve([1, 2]);
                    }, 10);
                });
            }).isArray()
            .optional('hello').isArray()

            .toPromise();
        });

        it('test #3 (failing)', function() {
            return rohr({foo: 'bar'})

            .prop('foo').isArray()

            .toPromise().then(function() {
                return Promise.reject();
            }).catch(function() {
                return Promise.resolve();
            });
        });

        it('without selected property', function() {
            try {
                rohr({foo: 1234}).isArray()
                should.fail();
            } catch (err) {
                return Promise.resolve();
            }
        });

        it('should do nothing while matchStatus === false', function() {
            return rohr({foo: 'bar', 'test': 'hello world'})
            .prop('foo').ifEquals('42')
                .prop('test').isArray()
            .endIf()

            .toPromise().then(function(object) {
                object.test.should.equal('hello world');
            });
        });
    });

    describe('castTo()', function() {
        it('string', function() {
            return rohr({foo: 42})

            .prop('foo').isNumber().castTo('string').isString()

            .toPromise().then(function(object) {
                object.foo.should.equal('42');
            });
        });

        it('string #2', function() {
            return rohr({foo: 42})

            .prop('foo').isNumber().transform(function(val) {
                return new Promise(function(resolve, reject) {
                    setTimeout(function() {
                        resolve(val);
                    }, 15);
                });
            }).castTo('string').isString()

            .toPromise().then(function(object) {
                object.foo.should.equal('42');
            });
        });

        it('integer', function() {
            return rohr({foo: '42.5'})

            .prop('foo').isString().castTo('integer').isNumber()

            .toPromise().then(function(object) {
                object.foo.should.equal(42);
            });
        });

        it('float', function() {
            return rohr({foo: '42.5'})

            .prop('foo').isString().castTo('float').isNumber()

            .toPromise().then(function(object) {
                object.foo.should.equal(42.5);
            });
        });

        it('date', function() {
            return rohr({foo: 0})

            .prop('foo').isNumber().castTo('date').isDate()

            .toPromise().then(function(object) {
                object.foo.toString().should.equal(new Date(0).toString());
            });
        });

        it('invalid type', function() {
            try {
                return rohr({foo: 0})

                .prop('foo').isNumber().castTo('blabla').isDate()

                .toPromise().then(function(object) {
                    should.fail('invalid type given to castTo()');
                });
            } catch (err) {
                return Promise.resolve();
            }
        });

        it('without selected property', function() {
            try {
                return rohr({foo: 0}).castTo('blabla');
                should.fail();
            } catch (err) {
                return Promise.resolve();
            }
        });

        it('with undefined property', function() {
            try {
                return rohr({foo: 0}).prop('test').castTo('blabla');
                should.fail();
            } catch (err) {
                return Promise.resolve();
            }
        });

        it('should do nothing while matchStatus === false', function() {
            return rohr({foo: 'bar', 'test': '36'})
            .prop('foo').ifEquals('42')
                .prop('test').castTo('integer')
            .endIf()

            .toPromise().then(function(object) {
                object.test.should.equal('36');
            });
        });
    });

    describe('nuke()', function() {
        it('should remove a property', function() {
            return rohr({foo: 'bar'})

            .prop('foo').nuke()
            .optional('bar').nuke()

            .toPromise().then(function(object) {
                if(object.foo) {
                    return Promise.reject();
                }
            });
        });

        it('should fail when not property is selected', function() {
            try {
                rohr({foo: 'bar'}).nuke();
                should.fail();
            } catch(err) {
                return Promise.resolve();
            }
        });

        it('should do nothing while matchStatus === false', function() {
            return rohr({foo: 'bar', 'test': 'hello world'})
            .prop('foo').ifEquals('42')
                .prop('test').nuke()
            .endIf()

            .toPromise().then(function(object) {
                object.test.should.equal('hello world');
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

        it('should set a property (async function) #2', function() {
            return rohr({foo: 123}).prop('foo').transform(function(val) {
                return new Promise(function(resolve, reject) {
                    setTimeout(function() {
                        resolve(val);
                    }, 5);
                });
            }).set('foo', function() {
                return new Promise(function(resolve, reject) { 
                    setTimeout(function() {
                        resolve('bar');
                    }, 20);
                });
            }).toPromise().then(function(object) {
                object.foo.should.equal('bar');
            });
        });

        it('should do nothing while matchStatus === false', function() {
            return rohr({foo: 'bar', 'test': 'hello world'})
            .prop('foo').ifEquals('42')
                .set('test', 'something else')
            .endIf()

            .toPromise().then(function(object) {
                object.test.should.equal('hello world');
            });
        });
    });

    describe('value()', function() {
        it('should set a property (sync value)', function() {
            return rohr({ foo: 1234 })

            .prop('foo').value('bar')
            .optional('test').value('hello world')

            .toPromise().then(function(object) {
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

        it('should set a property (async function) #2', function() {
            return rohr({ foo: 1234 }).prop('foo').transform(function(val) {
                return new Promise(function(resolve, reject) { 
                    setTimeout(function() {
                        resolve('bar');
                    }, 40);
                });
            }).value(function() {
                return 'bar';
            }).toPromise().then(function(object) {
                object.foo.should.equal('bar');
            });
        });

        it('should set a property (async function) #3', function() {
            return rohr({ foo: 1234 }).prop('foo').transform(function(val) {
                return new Promise(function(resolve, reject) { 
                    setTimeout(function() {
                        resolve('bar');
                    }, 40);
                });
            }).value(function() {
                return new Promise(function(resolve, reject) { 
                    setTimeout(function() {
                        resolve('bar');
                    }, 40);
                });
            }).toPromise().then(function(object) {
                object.foo.should.equal('bar');
            });
        });

        it('without selected property', function() {
            try {
                rohr({ foo: 1234 }).value(123);
                should.fail();
            } catch(err) {
                return Promise.resolve();
            }
        });

        it('should do nothing while matchStatus === false', function() {
            return rohr({foo: 'bar', 'test': 'hello world'})
            .prop('foo').ifEquals('42')
                .prop('test').value(1234)
            .endIf()

            .toPromise().then(function(object) {
                object.test.should.equal('hello world');
            });
        });
    });

    describe('rename()', function() {
        it('should rename a property #1', function() {
            return rohr({foo: 'bar'})

            .prop('foo').rename('baz')
            .optional('nonexistent').rename('test')

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

        it('without selected property', function() {
            try {
                rohr({foo: 'bar'}).rename('test');
                should.fail();
            } catch(err) {
                return Promise.resolve();
            }
        });

        it('should do nothing while matchStatus === false', function() {
            return rohr({foo: 'bar', 'test': 'hello world'})
            .prop('foo').ifEquals('42')
                .prop('test').rename('something else')
            .endIf()

            .toPromise().then(function(object) {
                object.test.should.equal('hello world');
            });
        });
    });

    describe('transform()', function() {
        it('w/ synchronous return value', function() {
            return rohr({foo: 'bar'})

            .prop('foo').transform(function(val) {
                return 'baz';
            })

            .optional('nonexistent').transform(function() {})

            .toPromise().then(function(object) {
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

        it('w/ rejected promise', function() {
            return rohr({foo: 'bar', test: 1234})

            .prop('foo').isString().transform(function(val) {
                return new Promise(function(resolve, reject) {
                    setTimeout(function() {
                        reject('err');
                    }, 25);
                });
            })

            .toPromise().then(function(object) {
                should.fail('promise should be rejected');
            }, function(err) {
                err.length.should.equal(1);
                err[0].error.should.equal('err');
                err[0].type.should.equal('TransformPromiseRejected');
                err[0].scope.should.equal('');
                err[0].property.should.equal('foo');
            });
        });

        it('without selected property', function() {
            try {
                rohr({}).transform(function() {});
                should.fail();
            } catch(err) {
                return Promise.resolve();
            }
        });

        it('should do nothing while matchStatus === false', function() {
            return rohr({foo: 'bar', 'test': 'hello world'})
            .prop('foo').ifEquals('42')
                .prop('test').transform(function(val) {
                    return 'bla bla';
                })
            .endIf()

            .toPromise().then(function(object) {
                object.test.should.equal('hello world');
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

        it('scope to non-object', function() {
            return rohr({foo: 1234})

            .prop('foo').scope()
                
            .toPromise().then(function(object) {
                should.fail('should not be here');
            }, function(err) {
                err.length.should.equal(1);
                err[0].type.should.equal('InvalidScopeToNonObject');
                err[0].property.should.equal('foo');
                err[0].scope.should.equal('')
            });
        });

        it('scope without selected property (fails)', function() {
            try {
                rohr({foo: 1234}).scope();
                should.fail();
            } catch (err) {
                return Promise.resolve();
            }
        });

        it('scope with undefined property (fails)', function() {
            try {
                rohr({foo: 1234}).prop('test').scope();
                should.fail();
            } catch (err) {
                return Promise.resolve();
            }
        });

        it('should do nothing while matchStatus === false', function() {
            return rohr({foo: 'bar', 'test': { baz: 'hello world'}})
            .prop('foo').ifEquals('42')
                .prop('test').scope().prop('baz').value(42)
            .endIf()

            .toPromise().then(function(object) {
                object.test.baz.should.equal('hello world');
            });
        });
    });

    describe('scopeBack()', function() {
        it('single scope', function() {
            return rohr({foo: { bar: 'baz' }})

            .prop('foo').scope().scopeBack()
                .prop('foo').isObject()

            .toPromise().then(function(object) {
                object.foo.bar.should.equal('baz');
            });
        });

        it('should do nothing while matchStatus === false', function() {
            return rohr({foo: 'bar', 'test': {baz: 24}})
            .prop('foo').ifEquals('42')
                .prop('test').scope().scopeBack()
            .endIf()

            .toPromise().then(function(object) {
                object.test.baz.should.equal(24);
            });
        });
    });

    describe('rootScope()', function() {
        it('test #1', function() {
            return rohr({ test: 2 }).rootScope().prop('test')

            .toPromise().then(function(object) {
                object.test.should.equal(2);
            });
        });

        it('test #2', function() {
            return rohr({ test: 2, foo: { bar: { baz: 1 } } })

            .prop('foo').scope()
                .prop('bar').scope()

            .rootScope().prop('test')

            .toPromise().then(function(object) {
                object.test.should.equal(2);
            });
        });

        it('test #3', function() {
            return rohr({ foo: 42, very: { deep: { hierarchy: { of: { stuff: {}}}}}})

            .prop('very').scope()
                .prop('deep').scope()
                    .prop('hierarchy').scope()
                        .prop('of').scope()
                            .prop('stuff').scope()

            .rootScope()

            .toPromise().then(function(object) {
                object.foo.should.equal(42);
            });
        });

        it('should do nothing while matchStatus === false', function() {
            return rohr({'test': {baz: 24}})
            .prop('test').scope().prop('baz').ifEquals('test')
                .rootScope()
            .endIf()

            .toPromise().then(function(object) {
                object.baz.should.equal(24);
            });
        });
    });

    describe('map()', function() {
        it('sync test', function() {
            return rohr({ test: [1, 2, 3, 4]})
            
            .prop('test').isArray().map(function(value) {
                return value * 2;
            })

            .optional('doesnotexist').map(function() {})

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

        it('emit error on map over non-array type', function() {
            return rohr({ test: 2 })
            
            .prop('test').map(function(value) {
                return value;
            })

            .toPromise().then(function(object) {
                should.fail('promise should be rejected');
            }, function(err) {
                err.length.should.equal(1);
                err[0].type.should.equal('MapOverNonArray');
            });
        });

        it('without selected property', function() {
            try {
                rohr({ test: 2 }).map(function(value) {
                    return value;
                });
                should.fail();
            } catch(err) {
                return Promise.resolve();
            }
        });

        it('should do nothing while matchStatus === false', function() {
            return rohr({foo: 'bar', 'test': [1, 2]})
            .prop('foo').ifEquals('42')
                .prop('test').map(function(value) {
                    return value * 2;
                })
            .endIf()

            .toPromise().then(function(object) {
                object.test[0].should.equal(1);
                object.test[1].should.equal(2);
            });
        });
    });

    describe('broadcast()', function() {
        it('should broadcast a value to a single field', function() {
            return rohr({ foo: 1234 })

            .prop('foo').broadcast('bar')
            .optional('nonexistent').broadcast('test')

            .toPromise().then(function(object) {
                object.bar.should.equal(1234);
            });
        });

        it('should broadcast a value to a single field #2', function() {
            return rohr({ foo: 1234 })

            .prop('foo').transform(function(val) {
                return new Promise(function(resolve, reject) {
                    setTimeout(function() {
                        resolve(val * 2);
                    }, 15);
                })
            }).broadcast('bar')
            .optional('nonexistent').broadcast('test')

            .toPromise().then(function(object) {
                object.bar.should.equal(2468);
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

        it('without selected property', function() {
            try {
                rohr({ foo: 1234 }).broadcast(['bar', 'baz', 'test']);
                should.fail();
            } catch (err) {
                return Promise.resolve();
            }
        });

        it('should do nothing while matchStatus === false', function() {
            return rohr({foo: 'bar', 'test': [1, 2]})
            .prop('foo').ifEquals('42')
                .prop('test').broadcast('foobar')
            .endIf()

            .toPromise().then(function(object) {
                if(object.foobar) {
                    return Promise.reject();
                }
            });
        });
    });

    describe('lookup()', function() {
        it('should lookup the property value in an array', function() {
            var data = [{id: 0, test: 'foo'}, {id: 1, test: 'bar'}, {id: 2, test: 'baz'}];
            return rohr({ index: 1})

            .prop('index').lookup(data, 'id')
            .optional('nonexistent').lookup([], 'test')

            .toPromise().then(function(object) {
                object.index.id.should.equal(1);
                object.index.test.should.equal('bar');
            });
        });

        it('should lookup the property value in an array #2', function() {
            var data = [{id: 0, test: 'foo'}, {id: 1, test: 'bar'}, {id: 2, test: 'baz'}];
            return rohr({ index: 0})

            .prop('index').transform(function(val) {
                return new Promise(function(resolve, reject) {
                    setTimeout(function() {
                        resolve(2);
                    }, 10)
                });
            }).lookup(data, 'id')

            .toPromise().then(function(object) {
                object.index.id.should.equal(2);
                object.index.test.should.equal('baz');
            });
        });

        it('should lookup the property value in an object', function() {
            var data = { foo: 1, bar: 2, baz: 3}
            return rohr({ index: 'baz' })

            .prop('index').lookup(data)

            .toPromise().then(function(object) {
                object.index.should.equal(3);
            });
        });

        it('should emit lookup error on failed lookup', function() {
            var data = [{id: 0, test: 'foo'}, {id: 1, test: 'bar'}, {id: 2, test: 'baz'}];
            return rohr({ index: 42 })

            .prop('index').lookup(data)

            .toPromise().then(function(object) {
                should.fail('promise should be rejected');
            }, function(err) {
                err.length.should.equal(1);
                err[0].type.should.equal('LookupFailed');
            });
        });

        it('should emit lookup error on failed lookup #2', function() {
            var data = { foo: 1, bar: 2, baz: 3}
            return rohr({ index: 'somethingElse' })

            .prop('index').lookup(data)

            .toPromise().then(function(object) {
                should.fail('promise should be rejected');
            }, function(err) {
                err.length.should.equal(1);
                err[0].type.should.equal('LookupFailed');
            });
        });

        it('without selected property', function() {
            try {
                rohr({ index: 'somethingElse' }).lookup([]);
                should.fail();
            } catch (err) {
                return Promise.resolve();
            }
        });

        it('with invalid object type', function() {
            try {
                rohr({ index: 'somethingElse' }).prop('index').lookup('abc');
                should.fail();
            } catch (err) {
                return Promise.resolve();
            }
        });

        it('should do nothing while matchStatus === false', function() {
            return rohr({foo: 0})
            .prop('foo').ifEquals('42')
                .prop('test').lookup([{id: 0}], 'id')
            .endIf()

            .toPromise().then(function(object) {
                object.foo.should.equal(0);
            });
        });
    });

    describe('rescope()', function() {
        it('test #1', function() { 
            return rohr({ foo: '1234' })

            .prop('foo').rescope('bar')
            .optional('nonexistent').rescope('1234')

            .rootScope()

            .toPromise().then(function(object) {
                object.bar.foo.should.equal('1234');
            });
        });

        it('test #2', function() { 
            return rohr({ foo: { bar: 'abc' }})

            .prop('foo').scope()
                .prop('bar').rescope('test', true)

            .rootScope()

            .toPromise().then(function(object) {
                object.test.bar.should.equal('abc');
            });
        });

        it('test #3', function() { 
            return rohr({ foo: { bar: 'abc' }})

            .prop('foo').scope()
                .prop('bar').rescope('test', false)

            .rootScope()

            .toPromise().then(function(object) {
                object.foo.test.bar.should.equal('abc');
            });
        });

        it('test #4', function() { 
            return rohr({ foo: { bar: 'abc' }})

            .prop('foo').scope()
                .prop('bar').rescope('some.deep.hierarchy.stuff.hello.world')

            .rootScope()

            .toPromise().then(function(object) {
                object.foo.some.deep.hierarchy.stuff.hello.world.bar.should.equal('abc');
            });
        });

        it('test #5', function() { 
            return rohr({ foo: { bar: 'abc', baz: 1234 }})

            .prop('foo').scope()
                .prop('baz').transform(function(val) {
                    return new Promise(function(resolve, reject) {
                        setTimeout(function() {
                            resolve(val * 2);
                        }, 10);
                    });
                })
                .prop('bar').rescope('foo.test')

            .rootScope()

            .toPromise().then(function(object) {
                object.foo.test.bar.should.equal('abc');
                object.foo.baz.should.equal(2468);
            });
        });

        it('without selected property', function() {
            try {
                rohr({}).rescope('foo')
                should.fail();
            } catch(err) {
                return Promise.resolve();
            }
        });

        it('should do nothing while matchStatus === false', function() {
            return rohr({foo: 0})
            .prop('foo').ifEquals('42')
                .prop('foo').rescope('bar')
            .endIf()

            .toPromise().then(function(object) {
                object.foo.should.equal(0);
            });
        });
    });

    describe('validate()', function() {
        it('test #1 (passing)', function() {
            return rohr({foo: 'bar'})

            .prop('foo').validate(function(value) {
                return value === 'bar';
            })
            .optional('nonexistent').validate(function() { return false; })

            .toPromise();
        });

        it('test #1 (failing)', function() {
            return rohr({foo: 'bar'})

            .prop('foo').validate(function(value) {
                return false;
            }).toPromise().then(function() {
                should.fail();
            }, function(err) {
                err.length.should.equal(1);
                err[0].type.should.equal('ValidationError');
                err[0].property.should.equal('foo');
                err[0].scope.should.equal('');
            });
        });

        it('test #2 (passing)', function() {
            return rohr({foo: 1234})

            .prop('foo').validate(function(value) {
                return new Promise(function(resolve, reject) {
                    setTimeout(function() {
                        resolve(true);
                    }, 10);
                });
            }).toPromise();
        });

        it('test #2 (failing)', function() {
            return rohr({foo: 1234})

            .prop('foo').validate(function(value) {
                return new Promise(function(resolve, reject) {
                    setTimeout(function() {
                        reject('someErrorMessage')
                    }, 10);
                });
            }).toPromise().then(function() {
                should.fail('promise should be rejected');
            }, function(err) {
                err.length.should.equal(1);
                err[0].type.should.equal('ValidationError');
                err[0].err.should.equal('someErrorMessage');
            });
        });

        it('test #3', function() {
            return rohr({foo: 1234})

            .prop('foo').transform(function(value) {
                return new Promise(function(resolve, reject) {
                    setTimeout(function() {
                        resolve('test');
                    }, 10);
                });
            }).validate(function(value) {
                return new Promise(function(resolve, reject) {
                    setTimeout(function() {
                        resolve(value === 'test');
                    }, 10);
                });
            }).toPromise();
        });

        it('without property', function() {
            try {
                rohr({}).validate(function() {});
                should.fail();
            } catch(err) {
                return Promise.resolve();
            }
        });

        it('should do nothing while matchStatus === false', function() {
            return rohr({foo: 0})
            .prop('foo').ifEquals('42')
                .prop('foo').validate(function() { return false; })
            .endIf()

            .toPromise().then(function(object) {
                object.foo.should.equal(0);
            });
        });
    });

    describe('ifEquals()', function() {
        it('with value (passing)', function() {
            return rohr({ foo: 'bar' })

            .prop('foo').ifEquals('bar').value('baz').endIf()
            .optional('test').ifEquals('123').value(42).endIf()

            .toPromise().then(function (object) {
                object.foo.should.equal('baz');
            });
        });

        it('with value (failing)', function() {
            return rohr({ foo: 'bar' })

            .prop('foo').ifEquals(1234).value('baz').endIf()

            .toPromise().then(function (object) {
                object.foo.should.equal('bar');
            });
        });

        it('with sync function (passing)', function() {
            return rohr({ foo: 'bar' })

            .prop('foo').ifEquals(function() {
                return 'bar';
            }).value('baz').endIf()
            .optional('test').ifEquals('123').value(42).endIf()

            .toPromise().then(function (object) {
                object.foo.should.equal('baz');
            });
        });

        it('with async function (passing)', function() {
            return rohr({ foo: 'bar' })

            .prop('foo').ifEquals(function() {
                return new Promise(function(resolve, reject) {
                    setTimeout(function() {
                        resolve('bar');
                    }, 10);
                });
            }).value('baz').endIf()

            .toPromise().then(function (object) {
                object.foo.should.equal('baz');
            });
        });

        it('with async function (passing) #2', function() {
            return rohr({ foo: 'bar' })

            .prop('foo').transform(function(val) {
                return new Promise(function(resolve, reject) {
                    setTimeout(function() {
                        resolve('val');
                    }, 10);
                });
            }).ifEquals(function() {
                return new Promise(function(resolve, reject) {
                    setTimeout(function() {
                        resolve('val');
                    }, 10);
                });
            }).value('baz').endIf()

            .toPromise().then(function (object) {
                object.foo.should.equal('baz');
            });
        });

        it('without selected property', function() {
            try {
                rohr({}).ifEquals('test');
                should.fail();
            } catch(err) {
                return Promise.resolve();
            }
        });

        it('nested ifEquals', function() {
            try {
                rohr({ foo: 123 }).prop('foo').ifEquals('test').ifEquals('test2')
                should.fail();
            } catch(err) {
                return Promise.resolve();
            }
        });

        it('toPromise() without endIf()', function() {
            try {
                rohr({ foo: 123 }).prop('foo').ifEquals('test').toPromise()
                should.fail();
            } catch(err) {
                return Promise.resolve();
            }
        });

        it('endIf() without ifEquals()', function() {
            try {
                rohr({ foo: 123 }).prop('foo').endIf()
                should.fail();
            } catch(err) {
                return Promise.resolve();
            }
        });

        it('endIf() without selected property', function() {
            try {
                rohr({ foo: 123 }).endIf()
                should.fail();
            } catch(err) {
                return Promise.resolve();
            }
        });

    });

    describe('Error behaviors', function() {
        it('test #1', function () {
            return rohr({ foo: { bar: 1234, baz: 2348} })

            .prop('foo').scope()
                .prop('bar').transform(function() {
                    return new Promise(function(resolve, reject) {
                        setTimeout(function() {
                            reject('err1');
                        }, 15);
                    });
                })
                .prop('baz').transform(function() {
                    return new Promise(function(resolve, reject) {
                        setTimeout(function() {
                            reject('err2');
                        }, 25);
                    });
                })
            .rootScope()

            .toPromise().then(function() {
                return Promise.reject();
            }, function (err) {
                err.length.should.equal(2);
            });
        });
    });
});
