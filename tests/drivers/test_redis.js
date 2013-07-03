var Osmos = require('../../lib');
var Schema = Osmos.Schema;
var Redis = Osmos.drivers.Redis;

var RedisMock = require('redis-mock');

var expect = require('chai').expect;
var async = require('async');

var server;
var model;

var schema = new Schema({
    name : String,
    email : String,
    age: [Number, Schema.configurators.optional]
});

describe('The Redis driver', function() {
    
    before(function(done) {
        var db;
        
        var db = new Redis(
            RedisMock.createClient(),
            function(err) {
                expect(err).to.be.null;
            }
        );

        Osmos.registerDriverInstance('redis', db);
        model = new Redis.Model(schema, 'users', 'redis');
        
        done();
    });
    
    it('should allow creating new Redis documents', function(done) {
        model.create(function(err, doc) {
            expect(err).to.be.null;
            
            expect(doc).to.be.an('object');
            expect(doc.constructor.name).to.equal('OsmosRedisDocument');
            
            done();
        });
    });
    
    it('should disallow saving documents without a key', function(done) {
        model.create(function(err, doc) {
            doc.name = 'Marco';
            doc.email = 'marcot@tabini.ca';

            function test() {
                doc.save();
            }
            
            expect(test).to.throw(Osmos.Error);
            
            done();
        });
    });
    
    it('should allow saving and retrieving documents with a valid key', function(done) {
        model.create(function(err, doc) {
            doc.name = 'Marco';
            doc.email = 'marcot@tabini.ca';
            doc.primaryKey = 'key';

            doc.save(function(err) {
                expect(err).to.be.null;

                model.get('key', function(err, doc) {
                    expect(err).to.be.null;
                    
                    expect(doc).to.be.an('object');
                    expect(doc.constructor.name).to.equal('OsmosRedisDocument');
                    
                    expect(doc.name).to.equal('Marco');
                    expect(doc.email).to.equal('marcot@tabini.ca');
                    expect(doc.primaryKey).to.equal('key');
            
                    done();
                });
            });
        });
    });
    
    it('should allow deleting documents by their key', function(done) {
        async.series(
            [
                function(callback) {
                    model.create(function(err, doc) {
                        doc.name = 'Marco';
                        doc.email = 'marcot@tabini.ca';
                        doc.primaryKey = 'key2';

                        doc.save(callback);
                    });
                },
                
                function(callback) {
                    model.get('key2', function(err, doc) {
                        expect(err).to.be.null;
                        
                        doc.delete(callback);
                    });
                },
                
                function(callback) {
                    model.get('key2', function(err, doc) {
                        expect(doc).to.be.undefined;
                        
                        callback(err);
                    });
                }
            ],
            
            function finalCallback(err) {
                expect(err).to.be.null;
                
                done();
            }
        );
    });
    
    it('should provide direct access to hincrby for a document', function(done) {
        model.create(function(err, doc) {
            doc.name = 'Marco';
            doc.email = 'marcot@tabini.ca',
            doc.age = 10;
            doc.primaryKey = 'key3';
            
            doc.save(function(err) {
                expect(err).to.be.null;
                
                doc.hincrby('age', 10, function(err) {
                    expect(err).to.be.null;
                    
                    expect(doc.age).to.equal(20);
                    
                    done();
                });
            });
        });
    });
    
});