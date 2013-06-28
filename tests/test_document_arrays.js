var expect = require('chai').expect;
var async = require('async');

var Osmos = require('../lib');
var Error = Osmos.Error;
var Schema = Osmos.Schema;
var Model = Osmos.Model;
var validators = Schema.validators;
var configurators = Schema.configurators;
var drivers = Osmos.drivers;

Osmos.registerDriverInstance('db', new drivers.Memory());

var transformer = {
    get : function(document, field, value) {
        switch(value) {
            case 'one':
                return 1;
                
            case 'two':
                return 2;
                
            default:
                throw new Error('Invalid value ' + value);
        }
    },
    
    set : function(document, field, value) {
        switch(value) {
            case 1:
                return 'one';
                
            case 2:
                return 'two';
                
            default:
                throw new Error('Invalid value ' + value);
        }
    }
};

transformer.constructor = Schema.Transformer;

var schema = new Schema({
    _primaryKey : [ String , configurators.primaryKey ],
    name : String,
    vals : [ Array , Number , transformer, validators.numberRange(1, 2) ],
    dats : [ Array , Number , validators.numberRange(1, 2) , configurators.optional ],
});

var model = new Model(schema, '', 'db');

describe('A document with an array field', function() {
    
    it('should be properly set up in the schema', function() {
        expect(schema.fields.vals.arrayTypeValidator.name).to.equal('osmosNumberValidator');
    });
    
    it('should be properly reflected when a document is created', function(done) {
        model.create(function(err, doc) {
            var data = doc.__raw__;
            
            expect(data.vals.constructor).to.equal(Array);
            expect(data.vals.length).to.equal(0);
            
            done();
        });
    });
    
    it('should be prevent non-existing values from being read', function(done) {
        model.create(function(err, doc) {
            var data = doc.__raw__;
            
            expect(data.vals.constructor).to.equal(Array);
            expect(data.vals.length).to.equal(0);

            function test() {
                var a = data.vals[0];
            }

            expect(test).to.throw(Error);
            
            done();
        });
    });
    
    it('should allow writing values to it', function(done) {
        model.create(function(err, doc) {
            var data = doc.__raw__;

            function test() {
                data.push(1);
                
                expect(data[0]).to.equal(1);
            }
            
            expect(test).not.to.throw(Error);
            
            done();
        });
    });
    
    it('should allow access to its raw array value', function(done) {
        model.create(function(err, doc) {
            var data = doc.__raw__;

            data.vals.push(1);
            
            expect(data.vals.__raw__).to.be.an('array');
            expect(data.vals.__raw__[0]).to.equal('one');
            
            done();
        });
    });
    
    it('should properly perform basic validation against the chosen type validator', function(done) {
        model.create(function(err, doc) {
            var data = doc.__raw__;
            
            data.dats.push('1');
            
            expect(doc.errors).to.have.length(1);
            
            var err = doc.errors[0];
            
            expect(err).to.be.an('object');
            expect(err.constructor.name).to.equal('OsmosError');
            expect(err.fieldName).to.equal('dats');
            
            done();
        });
    });
    
    it('should properly work when dereferenced directly from its containing document', function(done) {
        model.create(function(err, doc) {
            doc.vals.push(1);
            doc.vals.push(1);
            doc.vals.push(2);
            
            expect(doc.vals).to.have.length(3);
            expect(doc.vals[0]).to.equal(1);
            
            done();
        });
    });
    
    it('should properly save and restore data', function(done) {
        async.waterfall(
            [
                function(callback) {
                    model.create(callback);
                },
                
                function(doc, callback) {
                    doc.vals.push(1);
                    doc.name = 'marco';
                    
                    doc.save(function(err) {
                        expect(err).to.be.null;
                        expect(doc.primaryKey).to.be.a('string');
                        
                        callback(err, doc.primaryKey);
                    });
                },
                
                function(primaryKey, callback) {
                    model.get(primaryKey, callback);
                },
                
                function(doc, callback) {
                    expect(doc).to.be.an('object');

                    expect(doc.vals).to.have.length(1);
                    
                    callback(null);
                }
            ],
            
            function(err) {
                expect(err).to.equal(null);
                
                done();
            }
        );
    });
    
    it('should properly recognize `required` as meaning that the array must contain at least one element', function(done) {
        async.waterfall(
            [
                function(callback) {
                    model.create(callback);
                },
                
                function(doc, callback) {
                    doc.name = 'marco';
                    
                    doc.save(function(errs) {
                        expect(errs).to.be.an('array');
                        expect(errs).to.have.length(1);
                        
                        var err = errs[0];

                        expect(err).to.be.an('object');
                        expect(err.constructor.name).to.equal('OsmosError');
                        expect(err.fieldName).to.equal('vals');
                        
                        callback(null);
                    });
                },
                
            ],
            
            function(err) {
                expect(err).to.equal(null);
                
                done();
            }
        );
    });
    
    it('should reject a non-array value set explicitly', function(done) {
        model.create(function(err, doc) {
            doc.vals = 10;
            
            expect(doc.errors).to.be.an('array');
            expect(doc.errors).to.have.length(1);
            
            var err = doc.errors[0];

            expect(err).to.be.an('object');
            expect(err.constructor.name).to.equal('OsmosError');
            expect(err.fieldName).to.equal('vals');
            
            done();
        });
    });
    
    it('should accept an array value and wrap it in an array proxy appropriately', function(done) {
        model.create(function(err, doc) {
            doc.vals = [1, 2, 1];
            
            expect(doc.errors).to.be.an('array');
            expect(doc.errors).to.have.length(0);
            
            expect(doc.vals).to.be.an('array');
            expect(doc.vals.constructor.name).to.equal('Array');
            
            done();
        });
    });
    
    it('should reject an array that contains wrong data', function(done) {
        model.create(function(err, doc) {
            doc.vals = [1, 3, 3, 1];
            
            expect(doc.errors).to.be.an('array');
            expect(doc.errors).to.have.length(1);         

            var err = doc.errors[0];
            
            expect(err).to.be.an('object');
            expect(err.constructor.name).to.equal('OsmosError');
            expect(err.fieldName).to.equal('vals');
            expect(err.message).to.equal('[Item #1]: This value must be between 1 and 2');
            
            done();
        });
    });
    
});