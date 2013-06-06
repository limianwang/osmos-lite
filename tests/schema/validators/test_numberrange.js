var Osmos = require('../../../lib');
var expect = require('chai').expect;

describe('The number range validator', function() {
    it('should exist', function() {
        expect(Osmos.Schema.validators.numberRange).to.be.a('function');
    });

    it('should work with a valid value', function() {
        var validator = Osmos.Schema.validators.numberRange(10, 12);
        var err = validator('doc', 'field', 11);

        expect(err).to.equal(undefined);
    });
    
    it('should work at the lower boundary', function() {
        var validator = Osmos.Schema.validators.numberRange(10, 12);
        var err = validator('doc', 'field', 10);
        
        expect(err).to.equal(undefined);
    });
    
    it('should work at the upper boundary', function() {
        var validator = Osmos.Schema.validators.numberRange(10, 12);
        var err = validator('doc', 'field', 12);
        
        expect(err).to.equal(undefined);
    });
    
    it('should handle invalid values properly', function() {
        var validator = Osmos.Schema.validators.numberRange(10, 12);
        var err = validator('doc', 'field', 13);
        
        expect(err).to.be.an('object');
        expect(err.constructor.name).to.equal('OsmosError');
        expect(err.statusCode).to.equal(400);
    });
});