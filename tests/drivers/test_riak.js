var Osmos = require('../../lib');
var Schema = Osmos.Schema;
var Riak = Osmos.drivers.Riak;

var RiakMock = require('mock-riak');

var expect = require('chai').expect;
var async = require('async');

var server;
var model;

var schema = new Schema({
    name : String,
    email : String
});

describe('The Riak driver', function() {
   
    before(function(done) {
        server = new RiakMock(8098);

        server.start(function() {
            var db = new Riak({
                host: 'localhost',
                port: 8098
            });
        
            Osmos.registerDriverInstance('riak', db);
        
            model = new Riak.Model(schema, 'users', 'riak');
            
            done();
        });        
    });
    
    it('should allow creating new Riak documents', function(done) {
        model.create(function(err, doc) {
            expect(err).to.be.null;
            
            expect(doc).to.be.an('object');
            expect(doc.constructor.name).to.equal('OsmosRiakDocument');
            
            expect(doc.meta).to.be.an('object');
            expect(doc.meta.constructor.name).to.equal('OsmosRiakMeta');
            
            done();
        });
    });
    
    it('should allow posting Riak documents and reading their key', function(done) {
        model.create(function(err, doc) {
            doc.name = 'Marco';
            doc.email = 'marcot@tabini.ca';
            
            expect(doc.primaryKey).to.be.undefined;
            
            doc.save(function(err) {
                expect(err).to.be.null;
                
                expect(doc.primaryKey).not.to.be.undefined;
                
                done();
            });
        });
    });
    
    it('should allow putting Riak documents and reading their key', function(done) {
        model.create(function(err, doc) {
            doc.name = 'Marco';
            doc.email = 'marcot@tabini.ca';
            
            doc.primaryKey = 'marco';
            
            doc.save(function(err) {
                expect(err).to.be.null;
                
                expect(doc.primaryKey).to.equal('marco');
                
                done();
            });
        });
    });
    
    it('should allow putting and retrieving Riak documents by their key', function(done) {
        model.create(function(err, doc) {
            doc.name = 'Marco';
            doc.email = 'marcot@tabini.ca';
            
            doc.primaryKey = 'marco2';
            
            doc.save(function(err) {
                expect(err).to.be.null;
                
                model.get('marco2', function(err, doc) {
                    expect(err).to.be.null;
                    
                    expect(doc).to.be.an('object');
                    expect(doc.constructor.name).to.equal('OsmosRiakDocument');
                    
                    expect(doc.name).to.equal('Marco');
                    expect(doc.email).to.equal('marcot@tabini.ca');
                    
                    done();
                });
            });
        });
    });
    
    it('should allow deleting Riak documents by their key', function(done) {
        model.create(function(err, doc) {
            doc.name = 'Marco';
            doc.email = 'marcot@tabini.ca';
            
            doc.save(function(err) {
                expect(err).to.be.null;
                
                expect(doc.primaryKey).not.to.be.undefined;

                doc.delete(function(err) {
                    expect(err).to.be.null;
                    
                    model.get(doc.primaryKey, function(err, doc) {
                        expect(err).to.be.an('object');
                        expect(err.statusCode).to.equal(404);
                        
                        expect(doc).to.be.undefined;

                        done();
                    });
                });
            });
        });
    });
    
    it('should allow query Riak for documents based on secondary indices', function(done) {
        var data = [
            {
                data: {
                    name: 'Jack',
                    email: 'jack@example.org',
                },
                indices: {
                    name: 'jack',
                    age: 15
                }
            },
            {
                data: {
                    name: 'Joe',
                    email: 'joe@example.org',
                },
                indices: {
                    name: 'joe',
                    age: 18
                }
            },
            {
                data: {
                    name: 'Jill',
                    email: 'jill@example.org',
                },
                indices: {
                    name: 'jill',
                    age: 35
                }
            },
        ];
        
        var model = new Riak.Model(schema, 'users2', 'riak');
        
        async.series(
            [
                function(callback) {
                    async.each(
                        data,
                        
                        function iterator(record, callback) {
                            model.create(function(err, doc) {
                                expect(err).to.be.null;
                                
                                Object.keys(record.data).forEach(function(key) {
                                    doc[key] = record.data[key];
                                });
                                
                                doc.meta.index = record.indices;
                                
                                doc.save(callback);
                            });
                        },
                        
                        function finalCallback(err) {
                            expect(err).to.be.null;
                            
                            callback(err);
                        }
                    );
                },
                
                function(callback) {
                    model.find(
                        { age: [14, 20] },
                        function(err, results) {
                            expect(err).to.be.null;
                            
                            expect(results).to.be.an('array');
                            expect(results).to.have.length(2);
                            
                            expect(results[0]).to.be.an('object');
                            expect(results[0].constructor.name).to.equal('OsmosRiakDocument');
                            expect(results[0].primaryKey).not.to.be.undefined;
                            
                            expect(results[1]).to.be.an('object');
                            expect(results[1].constructor.name).to.equal('OsmosRiakDocument');
                            expect(results[1].primaryKey).not.to.be.undefined;
                            
                            callback();
                        }
                    );
                }
            ],
            
            function finalCallback(err) {
                expect(err).to.be.null;
                
                done();
            }
        );
    });
    
    it('should properly support map/reduce operations', function(done) {
        var data = [
            {
                data: {
                    name: 'Jack',
                    email: 'jack@example.org',
                },
                indices: {
                    name: 'jack',
                    age: 15
                }
            },
            {
                data: {
                    name: 'Joe',
                    email: 'joe@example.org',
                },
                indices: {
                    name: 'joe',
                    age: 18
                }
            },
            {
                data: {
                    name: 'Jill',
                    email: 'jill@example.org',
                },
                indices: {
                    name: 'jill',
                    age: 35
                }
            },
        ];
        
        var model = new Riak.Model(schema, 'users3', 'riak');
        
        async.series(
            [
                function(callback) {
                    async.each(
                        data,
                        
                        function iterator(record, callback) {
                            model.create(function(err, doc) {
                                expect(err).to.be.null;
                                
                                Object.keys(record.data).forEach(function(key) {
                                    doc[key] = record.data[key];
                                });
                                
                                doc.meta.index = record.indices;
                                
                                doc.save(callback);
                            });
                        },
                        
                        function finalCallback(err) {
                            expect(err).to.be.null;
                            
                            callback(err);
                        }
                    );
                },
                
                function(callback) {
                    model.mapReduce
                        .add({ bucket : 'users3' })
                        .map('Riak.mapValuesJson')
                        .map(function(value) {
                            var res = {};
                            
                            res[value.email] = 1;
                            
                            return res;
                        })
                        .reduce(function(values) {
                            var result = {};
                
                            values.forEach(function(values) {
                                Object.keys(values).forEach(function(value) {
                                    if (value in result) {
                                        result[value] += values[value];
                                    } else {
                                        result[value] = values[value];
                                    }
                                });
                            });
                
                            return [ result ];
                        })
                        .run(function(err, results) {
                            expect(err).to.be.null;
                            
                            expect(results).to.be.an('array');
                            expect(results).to.have.length(1);
                            
                            expect(Object.keys(results[0])).to.have.length(3);
                            
                            callback();
                        });
                }
            ],
            
            function finalCallback(err) {
                expect(err).to.be.null;
                
                done();
            }
        );        
    });
    
    it('should properly support autoindexing', function(done) {
        var data = [
            {
                name: 'Jack',
                email: 'jack@example.org',
            },
            {
                name: 'Joe',
                email: 'joe@example.org',
            },
            {
                name: 'Jill',
                email: 'jill@example.org',
            },
        ];
        
        var bucket = 'users4';
        
        var model = new Riak.Model(schema, bucket, 'riak');
        
        model.autoIndex('email', function(x) { return x.toUpperCase(); });
        
        async.series(
            [
                function(callback) {
                    async.each(
                        data,
                        
                        function iterator(record, callback) {
                            model.create(function(err, doc) {
                                expect(err).to.be.null;
                                
                                Object.keys(record).forEach(function(key) {
                                    doc[key] = record[key];
                                });
                                
                                doc.save(callback);
                            });
                        },
                        
                        function finalCallback(err) {
                            expect(err).to.be.null;
                            
                            callback(err);
                        }
                    );
                },
                
                function(callback) {
                    model.find(
                        {
                            email: 'JILL@EXAMPLE.ORG'
                        },
                        
                        function(err, docs) {
                            expect(err).to.be.null;
                            
                            expect(docs).to.be.an('array');
                            expect(docs).to.have.length(1);
                            
                            var doc = docs[0];
                            
                            expect(doc).to.be.an('object');
                            expect(doc.toJSON()).to.deep.equal(data[2]);
                            
                            done();
                        }
                    );
                }
            ],
            
            function finalCallback(err) {
                expect(err).to.be.null;
                
                done();
            }
        );        
    });
    
    after(function(done) {
        server.stop(done);
    });
    
});