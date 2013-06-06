var Osmos = require('../../../lib');
var expect = require('chai').expect;

describe('The string validator', function() {
    it('should exist', function() {
        expect(Osmos.Schema.validators.string).to.be.a('function');
    });
    
    it('should not throw errors', function() {
        function validate() {
            Osmos.Schema.validators.string({}, 'field', 123);
        }
        
        expect(validate).not.to.throw(Osmos.Error);
    });
    
    it('should report errors when an invalid value is passed', function() {
        var err = Osmos.Schema.validators.string({}, 'field', 123);
        
        expect(err).to.be.an('object');
        expect(err.constructor.name).to.equal('OsmosError');
        expect(err.statusCode).to.equal(400);
    });
    
    it('should allow proper values', function() {
        var err = Osmos.Schema.validators.string({}, 'field', 'value');
        
        expect(err).to.equal(undefined);
    })
});