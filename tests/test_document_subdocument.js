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

var subschema = new Schema({
    name : String,
    email : [ String , configurators.optional ]
});

subschema.validate = function subschemaValidate(document, data, callback) {
    if (data.email.length < 3) {
        callback([new Error('Invalid value ' + data.email, 400, null, 'email')]);
    }
};

var schema = new Schema({
    _primaryKey : [ String , configurators.primaryKey ],
    name : String,
    friend : [ Object , subschema ]
});

var model = new Model(schema, '', 'db');

describe('A document with a subdocument', function() {
    
    it('should be instantiatable', function(done) {
        model.create(function(err, doc) {
            expect(err).to.equal(null);
            expect(doc).to.be.an('object');
            
            done();
        });
    });
    
    it('should properly wrap subdocuments', function(done) {
        model.create(function(err, doc) {
            expect(doc.friend).to.be.an('object');
            expect(doc.friend.constructor.name).to.equal('OsmosSubdocument');
            
            done();
        });
    });
    
    it('should allow writing to and reading from fields', function(done) {
        model.create(function(err, doc) {
            doc.friend.name = 'Marco';
            
            expect(doc.friend.name).to.equal('Marco');
            
            done();
        });
    });
    
    it('should accept whole objects and wrap them appropriately', function(done) {
        model.create(function(err, doc) {
            doc.friend = {
                name: 'Marco',
                email: 'marcot@tabini.ca',
            };
            
            expect(doc.friend.name).to.equal('Marco');
            
            done();
        });
    });
    
    it('should properly validate data as it is being written', function(done) {
        model.create(function(err, doc) {
            doc.friend.email = 5;
            
            expect(doc.errors).to.be.an('array');
            expect(doc.errors).to.have.length(1);

            var err = doc.errors[0];
            
            expect(err).to.be.an('object');
            expect(err.constructor.name).to.equal('OsmosError');
            expect(err.fieldName).to.equal('friend.email');
            
            done();
        });
    });
    
    it('should properly validate fields when a whole subdocument is written', function(done) {
        model.create(function(err, doc) {
            doc.friend = {
                name: 'Marco',
                email: 5
            };
            
            expect(doc.errors).to.be.an('array');
            expect(doc.errors).to.have.length(1);

            var err = doc.errors[0];
            
            expect(err).to.be.an('object');
            expect(err.constructor.name).to.equal('OsmosError');
            expect(err.fieldName).to.equal('friend.email');
            
            done();
        });
    });
    
    it('should call the global validator on a subdocument when calling the global validator of the main schema', function(done) {
        model.create(function(err, doc) {
            doc.friend = {
                name: 'Marco',
                email: 'm'
            };
            
            doc.name = 'Manu';
            
            expect(doc.errors).to.be.an('array');
            expect(doc.errors).to.have.length(0);
            
            doc.validate(function(errs) {
                expect(errs).to.be.an('array');
                expect(errs).to.have.length(1);
                
                var err = errs[0];
                
                expect(err).to.be.an('object');
                expect(err.constructor.name).to.equal('OsmosError');
                expect(err.fieldName).to.equal('friend.email');
            
                done();
            });
        });
    });
    
    it('should properly save data to the backing store', function(done) {
        model.create(function(err, doc) {
            doc.friend = {
                name: 'Marco',
                email: 'marcot@tabini.ca'
            };
            
            doc.name = 'Manu';
            
            expect(doc.errors).to.be.an('array');
            expect(doc.errors).to.have.length(0);
            
            doc.save(function(errs) {
                expect(errs).to.equal(undefined);

                expect(doc._primaryKey).not.to.be.null;
                
                model.get(doc._primaryKey, function(err, doc) {
                    expect(err).to.equal(null);
                    expect(doc).to.be.an('object');
                    
                    expect(doc.constructor.name).to.equal('OsmosDocument');

                    expect(doc.friend).to.be.an('object');
                    expect(doc.friend.constructor.name).to.equal('OsmosSubdocument');
                    
                    expect(doc.name).to.equal('Manu');
                    expect(doc.friend.toJSON()).to.deep.equal({ name : 'Marco' , email : 'marcot@tabini.ca' });
                
                    done();
                });
            });
        });
    });
    
    it('should refuse to save a document when one of its subdocuments contains invalid data', function(done) {
        model.create(function(err, doc) {
            doc.friend = {
                name: 'Marco',
                email: 'm'
            };
            
            doc.name = 'Manu';
            
            expect(doc.errors).to.be.an('array');
            expect(doc.errors).to.have.length(0);
            
            doc.save(function(errs) {
                expect(errs).to.be.an('array');
                expect(errs).to.have.length(1);
                
                var err = errs[0];
                
                expect(err).to.be.an('object');
                expect(err.constructor.name).to.equal('OsmosError');
                expect(err.fieldName).to.equal('friend.email');
                
                expect(doc._primaryKey).to.equal(undefined);
                
                done();
            });
        });
    });
        
});
