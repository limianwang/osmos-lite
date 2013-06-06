var Osmos = require('../../../lib');
var expect = require('chai').expect;

describe('The string enumeration validator', function() {
    it('should exist', function() {
        expect(Osmos.Schema.validators.stringEnum).to.be.a('function');
    });

    it('should work with a valid value', function() {
        var validator = Osmos.Schema.validators.stringEnum(['a', 'b'], 'Error message');
        var err = validator('doc', 'field', 'a');
        
        expect(err).to.equal(undefined);
    });
    
    it('should handle invalid values properly', function() {
        var validator = Osmos.Schema.validators.stringEnum(['a', 'b'], 'Error message');
        var err = validator('doc', 'field', 'c');
        
        expect(err).to.be.an('object');
        expect(err.constructor.name).to.equal('OsmosError');
        expect(err.message).to.equal('Error message');
        expect(err.statusCode).to.equal(400);
    });
});