var Osmos = require('../../../lib');
var configurators = Osmos.Schema.configurators;
var expect = require('chai').expect;

describe('The optional configurator', function() {
    it('should exist', function() {
        expect(configurators.optional).to.be.a('function');
    });
    
    it('should work properly', function() {
        var f = new Osmos.Schema.Field('test', [ String , configurators.optional ]);
        
        expect(f.required).to.equal(false);
    })
});