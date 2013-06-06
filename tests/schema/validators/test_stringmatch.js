var Osmos = require('../../../lib');
var expect = require('chai').expect;

describe('The string match validator', function() {
    it('should exist', function() {
        expect(Osmos.Schema.validators.stringMatch).to.be.a('function');
    });

    it('should work with a valid value', function() {
        var validator = Osmos.Schema.validators.stringMatch(/test/, 'Error message');
        var err = validator('doc', 'field', 'test123');
        
        expect(err).to.equal(undefined);
    });
    
    it('should handle invalid values properly', function() {
        var validator = Osmos.Schema.validators.stringMatch(/test/, 'Error message');
        var err = validator('doc', 'field', 'nope');
        
        expect(err).to.be.an('object');
        expect(err.constructor.name).to.equal('OsmosError');
        expect(err.message).to.equal('Error message');
        expect(err.statusCode).to.equal(400);
    });
});