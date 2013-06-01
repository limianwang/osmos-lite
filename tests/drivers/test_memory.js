var Osmos = require('../../lib');
var Driver = Osmos.drivers.Memory;
var Model = require('../mocks/simplemodel');

var expect = require('chai').expect;
var async = require('async');

Model.driver = new Driver();

describe('The memory driver', function() {
   
    it('should support creating a new document', function(done) {
        var obj = new Model({ datum : 123 });
        
        expect(obj).to.be.an('object');
        expect(obj.datum).to.be.a('number');
        expect(obj.datum).to.equal(123);
        
        obj.save(function(err) {
            expect(err).to.be.undefined;
            expect(obj.primaryKey).to.be.a('string');
            
            done();
        });
    });
    
    it('should allow retrieval of an existing document', function(done) {
        var obj = new Model({ datum : 123 });
        
        expect(obj).to.be.an('object');
        expect(obj.datum).to.be.a('number');
        expect(obj.datum).to.equal(123);
        
        obj.save(function(err) {
            expect(err).to.equal(undefined);
            expect(obj.primaryKey).to.be.a('string');
            
            var key = obj.primaryKey;
            
            Model.get(key, function(err, result) {
                expect(err).to.be.null;
                expect(result).to.be.an('object');
                expect(result.primaryKey).to.be.a('string');
                expect(result.primaryKey).to.equal(key);
                
                done();
            });
        });
    });
    
    it('should allow deleting an existing document', function(done) {
        var obj = new Model({ datum : 123 });
        
        expect(obj).to.be.an('object');
        expect(obj.datum).to.be.a('number');
        expect(obj.datum).to.equal(123);
        
        obj.save(function(err) {
            expect(err).to.equal(undefined);
            expect(obj.primaryKey).to.be.a('string');
            
            var key = obj.primaryKey;
            
            Model.delete(key, function(err) {
                expect(err).to.be.null;
                
                Model.get(key, function(err, result) {
                    expect(err).to.be.undefined;
                    expect(result).to.be.null;
                
                    done();
                });
            });
        });
    });
    
    it('should allow updating an existing document', function(done) {
        var obj = new Model({ datum : 123 });
        
        expect(obj).to.be.an('object');
        expect(obj.datum).to.be.a('number');
        expect(obj.datum).to.equal(123);
        
        obj.save(function(err) {
            expect(err).to.equal(undefined);
            expect(obj.primaryKey).to.be.a('string');
            
            var key = obj.primaryKey;
            
            obj.datum = 124;
            
            obj.save(function(err) {
                expect(err).to.be.undefined;
                
                Model.get(key, function(err, result) {
                    expect(err).to.be.null;
                    expect(result.datum).to.equal(124);
                
                    done();
                });
            });
        });
    });
    
    it('should allow finding an existing document', function(done) {
        var obj = new Model({ datum : 153 });
        
        expect(obj).to.be.an('object');
        expect(obj.datum).to.be.a('number');
        expect(obj.datum).to.equal(153);
        
        obj.save(function(err) {
            expect(err).to.equal(undefined);
            expect(obj.primaryKey).to.be.a('string');
            
            Model.findOne({ datum : 153 }, function(err, match) {
                expect(err).to.be.null;
                expect(match).to.be.an('object');
                expect(match.primaryKey).to.equal(obj.primaryKey);
                expect(match.datum).to.equal(153);
                
                done();
            });
        });
    });
    
    it('should allow finding multiple existing documents', function(done) {
        async.series(
            [
                function(callback) {
                    var obj = new Model({ datum : 'test1' });
        
                    expect(obj).to.be.an('object');
                    expect(obj.datum).to.equal('test1');
        
                    obj.save(callback);
                },
                
                function(callback) {
                    var obj = new Model({ datum : 'test2' });
        
                    expect(obj).to.be.an('object');
                    expect(obj.datum).to.equal('test2');
        
                    obj.save(callback);
                },
                
                function(callback) {
                    var obj = new Model({ datum : 'test3' });
        
                    expect(obj).to.be.an('object');
                    expect(obj.datum).to.equal('test3');
        
                    obj.save(callback);
                }
            ],
            
            function() {
                Model.find({ datum : /test./i }, function(err, results) {
                    expect(err).to.be.null;
                    expect(results).to.be.an('array');
                    expect(results.length).to.equal(3);
                    expect(results[0]).to.be.an('object');
                    expect(results[0].constructor.name).to.equal('OsmosSimpleModel');
                    expect(results[1]).to.be.an('object');
                    expect(results[1].constructor.name).to.equal('OsmosSimpleModel');
                    expect(results[2]).to.be.an('object');
                    expect(results[2].constructor.name).to.equal('OsmosSimpleModel');
                    
                    done();
                });
            }
        );
    });
    
});