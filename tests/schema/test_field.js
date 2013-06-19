var Osmos = require('../../lib');
var expect = require('chai').expect;

describe('The field object', function() {
    it('should exist', function() {
        expect(Osmos.Schema.Field).to.be.a('function');
    });
    
    it('should require a type validator', function() {
        function test() {
            new Osmos.Schema.Field('test', []);
        }
        
        expect(test).to.throw(Osmos.Error);
    });
    
    it('should require an array type validator for array fields', function() {
        function test1() {
            new Osmos.Schema.Field('test', [ Array ]);
        }
        
        function test2() {
            new Osmos.Schema.Field('test', [ Array , String ]);
        }

        expect(test1).to.throw(Osmos.Error);
        expect(test2).not.to.throw(Osmos.Error);
    });
    
    it('should require an array type validator for array fields', function() {
        function test() {
            new Osmos.Schema.Field('test', [ Array ]);
        }
        
        expect(test).to.throw(Osmos.Error);
    });
    
    it('should accept a proper descriptor', function() {
        var configurator = function(field, callback) {
            field.primaryKey = true;
            callback(null)
        };
        configurator.constructor = Osmos.Schema.Configurator;
        
        var validator = function() {};
        validator.constructor = Osmos.Schema.Validator;
        
        var transformer = function() {};
        transformer.constructor = Osmos.Schema.Transformer;
        
        var field = new Osmos.Schema.Field('test', [ String , configurator , validator , transformer ]);
        
        expect(field).to.be.an('object');
        expect(field.typeValidator).to.equal(Osmos.Schema.validators.string);
        expect(field.arrayTypeValidator).to.be.null;
        expect(field.subdocumentSchema).to.be.null;
        
        expect(field.validators).to.have.length(2);
        expect(field.validators).to.include(validator);
        expect(field.validators).to.include(Osmos.Schema.validators.string);
        
        expect(field.transformers).to.have.length(1);
        expect(field.transformers[0]).to.equal(transformer);
        
        expect(field.primaryKey).to.be.true;
    });
});