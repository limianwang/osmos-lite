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

    it('should allow attaching to the willSave hook', function(done) {
        function plugin(doc) {
            doc.hook('willSave', function(data, callback) {
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

    it('should allow attaching to the didSave hook', function(done) {
        function plugin(doc) {
            doc.hook('didSave', function(data, callback) {
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
                
                expect(doc._primaryKey).not.to.be.undefined;
                
                done();
            })
        });
    });

    it('should allow attaching to the willDelete hook', function(done) {
        function plugin(doc) {
            doc.hook('willDelete', function(data, callback) {
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
                expect(errs).to.be.null;
                
                doc.delete(function(errs) {
                    expect(errs).to.be.an('array');
                    expect(errs).to.have.length(1);
                
                    var err = errs[0];
                
                    expect(err).to.be.an('object');
                    expect(err.constructor.name).to.equal('OsmosError');
                    expect(err.message).to.equal('Invalid astroturfing bit.');
                
                    model.get(doc._primaryKey, function(err, doc) {
                        expect(err).to.be.null;
                        
                        expect(doc).to.be.an('object');
                        expect(doc._primaryKey).not.to.be.undefined;
                
                        done();
                    });
                });
            })
        });
    });
    
    it('should allow attaching to the didDelete hook', function(done) {
        var deleted;
        
        function plugin(doc) {
            doc.hook('didDelete', function(data, callback) {
                expect(data.document).to.be.an('object');
                expect(data.document.constructor.name).to.equal('OsmosDocument');
                
                deleted = true;
                                
                callback(null);
            });
        };
        
        model.create(function(err, doc) {
            doc.plugin(plugin);
            
            doc.name = 'Marco';
            
            doc.save(function(errs) {
                expect(errs).to.be.null;
                
                doc.delete(function(errs) {
                    expect(errs).to.be.null;
                    expect(deleted).to.equal(true);
                
                    model.get(doc._primaryKey, function(err, doc) {
                        expect(err).to.be.null;
                        
                        expect(doc).to.be.undefined;
                
                        done();
                    });
                });
            })
        });
    });
    
});
