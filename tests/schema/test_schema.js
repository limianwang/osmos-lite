var Osmos = require('../../lib');
var expect = require('chai').expect;

describe('The schema object', function() {
    it('should exist', function() {
        expect(Osmos.Schema).to.be.a('function');
    });
    
    it('should accept a properly formatted spec', function() {
        var s = new Osmos.Schema({
            f1 : String,
            f2 : Number
        });
        
        expect(s).to.be.an('object');
        expect(s.fields.f1).to.be.an('object');
        expect(s.fields.f1.constructor.name).to.equal('OsmosField');
        expect(s.fields.f2).to.be.an('object');
        expect(s.fields.f2.constructor.name).to.equal('OsmosField');
    });
});