var Osmos = require('../../../lib');
var expect = require('chai').expect;

describe('The string enumeration validator', function() {
    it('should exist', function() {
        expect(Osmos.Schema.validators.stringEnum).to.be.a('function');
    });

    it('should work with a valid value', function(done) {
        var validator = Osmos.Schema.validators.stringEnum(['a', 'b'], 'Error message');
        
        validator('doc', 'field', 'a', function(err) {
            expect(err).to.equal(undefined);
            done();
        });
    });
    
    it('should handle invalid values properly', function(done) {
        var validator = Osmos.Schema.validators.stringEnum(['a', 'b'], 'Error message');
        
        validator('doc', 'field', 'c', function(err) {
            expect(err).to.be.an('object');
            expect(err.constructor.name).to.equal('OsmosError');
            expect(err.message).to.equal('Error message');
            done();
        });
    });
});