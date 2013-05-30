var Osmos = require('../../../lib');
var configurators = Osmos.Schema.configurators;
var expect = require('chai').expect;

describe('The primary key configurator', function() {
    it('should exist', function() {
        expect(configurators.primaryKey).to.be.a('function');
    });
    
    it('should work properly', function() {
        var f = new Osmos.Schema.Field('test', [ String , configurators.primaryKey ]);
        
        expect(f.primaryKey).to.equal(true);
    })
});