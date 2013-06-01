var expect = require('chai').expect;
var Osmos = require('../lib');

var Schema = Osmos.Schema;
var Model = Osmos.Model;
var Memory = Osmos.drivers.Memory;

describe('The Model object', function() {
    it('should exist', function() {
        expect(Osmos.Model).to.be.a('function');
    });

    var schema = new Schema({
        id : [ String , Schema.configurators.primaryKey ],
        name : String            
    });
    
    var db = new Memory();
    var model = new Model(schema, '', db);
    
    db.post('', { name : 'Marco' , toJSON : function() { return { name : 'Marco' }} }, function() {});
    
    it('should allow the creation of new documents', function(done) {
        model.create(function(err, doc) {
            expect(err).to.be.null;
            expect(doc).to.be.an('object');
            
            done();
        });
    });

    it('should allow finding multiple documents', function(done) {
        model.find({ name : 'Marco' }, function(err, docs) {
            expect(err).to.be.null;
            expect(docs).to.be.an('array');
            expect(docs).to.have.length(1);
            done();
        });
    });
    
    it('should find one document', function(done) {
        model.findOne({ name : 'Marco' }, function(err, doc) {
            expect(err).to.be.null;
            expect(doc).to.be.an('object');
            expect(doc.constructor.name).to.equal('OsmosDocument');
            
            done();
        });
    });
    
    it('should properly delete documents', function(done) {
        model.delete({ name : 'Marco' }, function(err, count) {
            expect(err).to.be.null;
            expect(count).to.equal(1);
            
            done();
        });
    });
});