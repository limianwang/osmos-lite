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
    age : [Number , configurators.optional , validators.numberRange(0, 99) ],
    val : [Number , transformer, validators.numberRange(1, 2) ]
});

schema.validate = function validate(document, data, callback) {
    if (data.val == 'two') {
        return callback([ new Error('Invalid value 2', 400, null, 'val') ]);
    }
    
    callback([]);
};

var model = new Model(schema, '', 'db');

describe('The document class', function() {
    it('should exist', function() {
        expect(Osmos.Document).to.be.a('function');
    });
    
    it('should allow writing to properly declared fields', function(done) {
        model.create(function(err, doc) {
            expect(doc).to.be.an('object');
            expect(doc.constructor.name).to.equal('OsmosDocument');

            function test() {
                doc.name = 'marco';
            }
            
            expect(test).not.to.throw(Osmos.Error);
            
            done();
        });
    });
    
    it('should refuse writing to a non-existing field', function(done) {
        model.create(function(err, doc) {
            expect(doc).to.be.an('object');
            expect(doc.constructor.name).to.equal('OsmosDocument');

            function test() {
                doc.name = 'marco';
                doc.invalid = 'value';
            }
            
            expect(test).to.throw(Osmos.Error);
            
            done();
        });
    });
    
    it('should allow reading from a declared field', function(done) {
        function test() {
            model.create(function(err, doc) {
                doc.name = 'marco';
            
                expect(doc.name).to.equal('marco');
                
                done();
            });
        }
        
        expect(test).not.to.throw(Osmos.Error);
    });
    
    it('should perform transformations when reading and writing data', function(done) {
        model.create(function(err, doc) {
            doc.val = 1;
            
            expect(doc.__raw__.val).to.equal('one');
            
            expect(doc.val).to.equal(1);
            done();
        });
    });
    
    it('should perform validations when writing data', function(done) {
        model.create(function(err, doc) {
            doc.val = 3;
            
            expect(doc.errors).to.be.an('array');
            expect(doc.errors).to.have.length(1);
            expect(doc.errors[0]).to.be.an('object');
            
            var err = doc.errors[0];
            
            expect(err.constructor.name).to.equal('OsmosError');
            expect(err.fieldName).to.equal('val');
            
            done();
        });
    });
    
    it('should allow saving a document', function(done) {
        model.create(function(err, doc) {
            doc.name = 'marco';
            doc.val = 1;
            
            doc.save(function(err) {
                expect(err).to.equal(null);
                
                done();
            });
        });
    }); 
    
    it('should actually save a document', function(done) {
        async.waterfall(
            [
                function(callback) {
                    model.create(callback);
                },
                
                function(doc, callback) {
                    doc.name = 'marco';
                    doc.val = 1;
                    
                    doc.save(function(err) {
                        expect(err).to.equal(null);
                        
                        callback(null, doc.primaryKey);
                    });
                },
                
                function(primaryKey, callback) {
                    var doc = model.get(primaryKey, function(err, doc) {
                        callback(err, doc, primaryKey);
                    });
                },
                
                function(doc, primaryKey, callback) {
                    expect(doc).to.be.an('object');
                    expect(doc.constructor.name).to.equal('OsmosDocument');
                    
                    expect(doc.name).to.be.a('string');
                    expect(doc.name).to.equal('marco');
                    
                    expect(doc.val).to.be.a('number');
                    expect(doc.val).to.equal(1);
                    
                    expect(doc.primaryKey).to.be.a('string');
                    expect(doc.primaryKey).to.equal(primaryKey);
                    
                    callback(null);
                }
            ],
            
            done
        );
    })
    
    it('should set the primary key when saving a document', function(done) {
        model.create(function(err, doc) {
            doc.name = 'marco';
            doc.val = 1;
            
            doc.save(function(err) {
                expect(err).to.equal(null);
                expect(doc.primaryKey).not.to.equal(null);
                
                done();
            });
        });
    }); 
    
    it('should call the global validator before saving', function(done) {
        model.create(function(err, doc) {
            doc.name = 'marco';
            doc.val = 2;
            
            doc.save(function(errs) {
                expect(errs).to.be.an('array');
                expect(errs).to.have.length(1);
                
                var err = errs[0];
                
                expect(err).to.be.an('object');
                expect(err.constructor.name).to.equal('OsmosError');
                expect(err.fieldName).to.equal('val');
                
                done();
            });
        });
    });
    
    it('should properly delete a document', function(done) {
        async.waterfall(
            [
                function(callback) {
                    model.create(callback);
                },
                
                function(doc, callback) {
                    doc.name = 'marco';
                    doc.val = 1;
                    
                    doc.save(function(err) {
                        expect(err).to.equal(null);
                        
                        callback(err, doc);
                    });
                },
                
                function(doc, callback) {
                    doc.delete(function(err) {
                        callback(err, doc.primaryKey);
                    });
                },
                
                function(primaryKey, callback) {
                    model.get(primaryKey, function(err, doc) {
                        expect(err).to.equal(null);
                        expect(doc).to.equal(undefined);
                        
                        callback(null);
                    });
                }
            ],
            
            function(err) {
                expect(err).to.equal(null);
                
                done();
            }
        );
    });
    
});