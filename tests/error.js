var osmos = require('../lib');
var expect = require('chai').expect;

describe('The Error object', function() {
    it('should exist', function() {
        expect(osmos.Error).to.be.a('function');
    });
    
    it('should correctly record a status code, even when it is not provided', function() {
        var err = new osmos.Error('Error');
        
        expect(err.statusCode).to.equal(500);
        
        err = new osmos.Error('Error', 444);
        
        expect(err.statusCode).to.equal(444);
    });
});