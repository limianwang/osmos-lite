var Osmos = require('../../../lib');
var configurators = Osmos.Schema.configurators;
var expect = require('chai').expect;

describe('The alias configurator', function() {
    it('should exist', function() {
        expect(configurators.alias).to.be.a('function');
    });
    
    it('should work properly', function() {
        var f = new Osmos.Schema.Field('test', [ String , configurators.alias('newName') ]);
        
        expect(f.alias).to.equal('newName');
    })
});