var Osmos = require('../../../lib');
var expect = require('chai').expect;

describe('The date validator', function() {
    it('should exist', function() {
        expect(Osmos.Schema.validators.date).to.be.a('function');
    });
    
    it('should not throw errors', function() {
        function validate() {
            Osmos.Schema.validators.date({}, 'field', 123);
        }
        
        expect(validate).not.to.throw(Osmos.Error);
    });
    
    it('should report errors when an invalid value is passed', function() {
        var err = Osmos.Schema.validators.date({}, 'field', 123);
        
        expect(err).to.be.an('object');
        expect(err.constructor.name).to.equal('OsmosError');
        expect(err.statusCode).to.equal(400);
    });
    
    it('should allow proper values', function() {
        var err = Osmos.Schema.validators.date({}, 'field', new Date());

        expect(err).to.equal(undefined);
    })
});