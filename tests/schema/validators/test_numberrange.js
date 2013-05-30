var Osmos = require('../../../lib');
var expect = require('chai').expect;

describe('The number range validator', function() {
    it('should exist', function() {
        expect(Osmos.Schema.validators.numberRange).to.be.a('function');
    });

    it('should work with a valid value', function(done) {
        var validator = Osmos.Schema.validators.numberRange(10, 12);
        
        validator('doc', 'field', 11, function(err) {
            expect(err).to.equal(undefined);
            done();
        });
    });
    
    it('should work at the lower boundary', function(done) {
        var validator = Osmos.Schema.validators.numberRange(10, 12);
        
        validator('doc', 'field', 10, function(err) {
            expect(err).to.equal(undefined);
            done();
        });
    });
    
    it('should work at the upper boundary', function(done) {
        var validator = Osmos.Schema.validators.numberRange(10, 12);
        
        validator('doc', 'field', 12, function(err) {
            expect(err).to.equal(undefined);
            done();
        });
    });
    
    it('should handle invalid values properly', function(done) {
        var validator = Osmos.Schema.validators.numberRange(10, 12);
        
        validator('doc', 'field', 13, function(err) {
            expect(err).to.be.an('object');
            expect(err.constructor.name).to.equal('OsmosError');
            done();
        });
    });
});