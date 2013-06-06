var Osmos = require('../../../lib');
var expect = require('chai').expect;

describe('The array validator', function() {
    it('should exist', function() {
        expect(Osmos.Schema.validators.array).to.be.a('function');
    });
    
    it('should not throw errors', function() {
        function f() {
            Osmos.Schema.validators.array({}, 'field', 123);
        }

        expect(f).not.to.throw(Osmos.Error);
    });
    
    it('should report errors when an invalid value is passed', function() {
        var err = Osmos.Schema.validators.array({}, 'field', 123);
        
        expect(err).to.be.an('object');
        expect(err.constructor.name).to.equal('OsmosError');
        expect(err.statusCode).to.equal(400);
    });
    
    it('should allow proper values', function() {
        var err = Osmos.Schema.validators.array({}, 'field', [1, 2, 3]);
        
        expect(err).to.equal(undefined);
    })
});