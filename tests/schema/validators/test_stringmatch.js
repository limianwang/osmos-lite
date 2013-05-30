var Osmos = require('../../../lib');
var expect = require('chai').expect;

describe('The string match validator', function() {
    it('should exist', function() {
        expect(Osmos.Schema.validators.stringMatch).to.be.a('function');
    });

    it('should work with a valid value', function(done) {
        var validator = Osmos.Schema.validators.stringMatch(/test/, 'Error message');
        
        validator('doc', 'field', 'test123', function(err) {
            expect(err).to.equal(undefined);
            done();
        });
    });
    
    it('should handle invalid values properly', function(done) {
        var validator = Osmos.Schema.validators.stringMatch(/test/, 'Error message');
        
        validator('doc', 'field', 'nope', function(err) {
            expect(err).to.be.an('object');
            expect(err.constructor.name).to.equal('OsmosError');
            expect(err.message).to.equal('Error message');
            done();
        });
    });
});