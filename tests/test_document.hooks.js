var expect = require('chai').expect;
var async = require('async');

var Osmos = require('../lib');
var Error = Osmos.Error;
var Schema = Osmos.Schema;
var Model = Osmos.Model;
var validators = Schema.validators;
var configurators = Schema.configurators;
var drivers = Osmos.drivers;

Osmos.registerDriverInstance('db', new drivers.Memory());

var schema = new Schema({
    _primaryKey : [ String , configurators.primaryKey ],
    name : String,
});

var model = new Model(schema, '', 'db');

describe('The document class hook system', function() {
    it('should allow attaching to the willValidate hook', function(done) {
        function plugin(doc) {
            doc.hook('willValidate', function(data, callback) {
                expect(data.document).to.be.an('object');
                expect(data.document.constructor.name).to.equal('OsmosDocument');
                
                expect(data.errors).to.be.an('array');
                expect(data.errors).to.have.length(0);
                
                data.errors.push(new Error('Invalid astroturfing bit.'));
                
                callback(null);
            });
        };
        
        model.create(function(err, doc) {
            doc.plugin(plugin);
            
            doc.name = 'Marco';
            
            doc.save(function(errs) {
                expect(errs).to.be.an('array');
                expect(errs).to.have.length(1);
                
                var err = errs[0];
                
                expect(err).to.be.an('object');
                expect(err.constructor.name).to.equal('OsmosError');
                expect(err.message).to.equal('Invalid astroturfing bit.');
                
                expect(doc._primaryKey).to.be.undefined;
                
                done();
            })
        });
    });

    it('should allow attaching to the didValidate hook', function(done) {
        function plugin(doc) {
            doc.hook('didValidate', function(data, callback) {
                expect(data.document).to.be.an('object');
                expect(data.document.constructor.name).to.equal('OsmosDocument');
                
                expect(data.errors).to.be.an('array');
                expect(data.errors).to.have.length(0);
                
                data.errors.push(new Error('Invalid astroturfing bit.'));
                
                callback(null);
            });
        };
        
        model.create(function(err, doc) {
            doc.plugin(plugin);
            
            doc.name = 'Marco';
            
            doc.save(function(errs) {
                expect(errs).to.be.an('array');
                expect(errs).to.have.length(1);
                
                var err = errs[0];
                
                expect(err).to.be.an('object');
                expect(err.constructor.name).to.equal('OsmosError');
                expect(err.message).to.equal('Invalid astroturfing bit.');
                
                expect(doc._primaryKey).to.be.undefined;
                
                done();
            })
        });
    });
    
});
