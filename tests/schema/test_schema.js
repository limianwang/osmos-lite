var expect = require('chai').expect;
var async = require('async');

var Osmos = require('../../lib');
var Schema = Osmos.Schema;
var validators = Schema.validators;
var configurators = Schema.configurators;
var Error = Osmos.Error;

describe('The schema object', function() {
    it('should exist', function() {
        expect(Osmos.Schema).to.be.a('function');
    });
    
    it('should accept a properly formatted spec', function() {
        var s = new Osmos.Schema({
            f1 : String,
            f2 : Number
        });
        
        expect(s).to.be.an('object');
        expect(s.fields.f1).to.be.an('object');
        expect(s.fields.f1.constructor.name).to.equal('OsmosField');
        expect(s.fields.f2).to.be.an('object');
        expect(s.fields.f2.constructor.name).to.equal('OsmosField');
    });
    
    it('should properly validate a document', function(done) {
        var s = new Schema({
            id : [Number , configurators.primaryKey ],
            name : String
        });
        
        expect(s.validateDocument).to.be.a('function');
        
        s.validateDocument({}, {id : 123}, function(err) {
            expect(err).to.be.an('array');
            expect(err).to.have.length(1);
            expect(err[0]).to.be.an('object');
            expect(err[0].constructor.name).to.equal('OsmosError');
            expect(err[0].fieldName).to.equal('name');
            expect(err[0].statusCode).to.equal(400);
            
            done();
        });
    });

    it('should properly call the global validator as appropriate', function(done) {
        var s = new Schema({
            id : [ Number , configurators.primaryKey ],
            name : String
        });
        
        s.validate = function validate(document, value, callback) {
            callback([new Error('test')]);
        }
    
        expect(s.validateDocument).to.be.a('function');
    
        s.validateDocument({}, {id : 123 ,  name : 'marco'}, function(err) {
            expect(err).to.be.an('array');
            expect(err).to.have.length(1);
            expect(err[0]).to.be.an('object');
            expect(err[0].message).to.equal('test');
        
            done();
        });     
    });
    
    it('should validate a field upon request', function() {
        var s = new Schema({
            id : [ Number , configurators.primaryKey , validators.numberRange(1, 10) ],
            name : String
        });
        
        expect(s.validateField).to.be.a('function');
    
        var err = s.validateField({}, 'id', 123);
        
        expect(err).to.be.an('object');
        expect(err).to.be.an('object');
        expect(err.message).to.equal('This value must be between 1 and 10');
        expect(err.fieldName).to.equal('id');
    });
    
    it('should transform a value properly', function() {
        var transformer = {
            get : function(document, field, rawValue) {
                switch(rawValue) {
                    case 1:
                        return 'one';
                        
                    case 2:
                        return 'two';
                        
                    case 3:
                        return 'three';
                        
                    default:
                        return new Error('Invalid value ' + rawValue);
                }
            },
            
            set : function(document, field, value, callback) {
                switch(value) {
                    case 'one':
                        return 1;
                        
                    case 'two':
                        return 2;
                        
                    case 'three':
                        return 3;
                        
                    default:
                        return new Error('Invalid value ' + value);
                }
            }
        };
        
        transformer.constructor = Schema.Transformer;
        
        var s = new Schema({
            id : [ Number , configurators.primaryKey ],
            name : [ String , transformer ]
        });
        
        expect(s.validateField).to.be.a('function');
            
        var transformedValue = s.transformFieldValue({}, 'name', 'one');
        expect(transformedValue).to.equal(1);
                
        transformedValue = s.transformFieldValue({}, 'name', 'four');
        expect(transformedValue).to.be.an('object');
        expect(transformedValue.constructor.name).to.equal('OsmosError');

        transformedValue = s.transformedValueOfField({}, 'name', 1);
        expect(transformedValue).to.equal('one');

        transformedValue = s.transformedValueOfField({}, 'name', 4);
        expect(transformedValue).to.be.an('object');
        expect(transformedValue.constructor.name).to.equal('OsmosError');
    });
});