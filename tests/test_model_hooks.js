var expect = require('chai').expect;
var Osmos = require('../lib');

var Schema = Osmos.Schema;
var Model = Osmos.Model;
var Memory = Osmos.drivers.Memory;

var Error = Osmos.Error;

var schema = new Schema({
    id : [ String , Schema.configurators.primaryKey ],
    name : String            
});

var db = new Memory();

describe('The Model object hook system', function() {
    
    it('should allow attaching to the willCreate hook', function(done) {
        var model = new Model(schema, '', db);

        function plugin(model) {
            model.hook('willCreate', function(data, callback) {
                data.error = new Error('Invalid bit.');
                
                callback();
            });
        }
        
        model.plugin(plugin);
        
        model.create(function(err, doc) {
            expect(err).to.be.an('object');
            expect(err.constructor.name).to.equal('OsmosError');
            
            expect(doc).to.be.undefined;
            
            done();
        });
        
    });

    it('should allow attaching to the didCreate hook', function(done) {
        var model = new Model(schema, '', db);
        
        var created;

        function plugin(model) {
            model.hook('didCreate', function(data, callback) {
                expect(data.document).to.be.an('object');
                expect(data.document.constructor.name).to.equal('OsmosDocument');
                
                created = true;
                
                callback();
            });
        }
        
        model.plugin(plugin);
        
        model.create(function(err, doc) {
            expect(err).to.be.null;
            
            expect(doc).to.be.an('object');
            expect(doc.constructor.name).to.equal('OsmosDocument');
            
            expect(created).to.be.true;
            
            done();
        });
        
    });
    
    it('should allow attaching to the willGet hook', function(done) {
        var model = new Model(schema, '', db);
        
        function plugin(model) {
            model.hook('willGet', function(data, callback) {
                data.error = new Error('Invalid bit.');
                
                callback();
            });
        }
        
        model.plugin(plugin);
        
        model.get('123', function(err, doc) {
            expect(err).to.be.an('object');
            expect(err.constructor.name).to.equal('OsmosError');
            
            expect(doc).to.be.undefined;
            
            done();
        });
        
    });

    it('should allow attaching to the didGet hook', function(done) {
        var model = new Model(schema, '', db);
        
        var got;

        function plugin(model) {
            model.hook('didGet', function(data, callback) {
                expect(data.document).to.be.an('object');
                expect(data.document.constructor.name).to.equal('OsmosDocument');
                
                got = true;
                
                callback();
            });
        }
        
        model.plugin(plugin);
        
        model.create(function(err, doc) {
            expect(err).to.be.null;

            doc.name = 'Marco';
            
            doc.save(function(err) {
                model.get(doc.id, function(err, doc) {
                    expect(err).to.be.null;
                    
                    expect(doc).to.be.an('object');
                    expect(doc.constructor.name).to.equal('OsmosDocument');
                    
                    expect(got).to.be.true;
                });
                
                done();
            });
        });
    });
    
    it('should allow attaching to the willFindOne hook', function(done) {
        var model = new Model(schema, '', db);
        
        function plugin(model) {
            model.hook('willFindOne', function(data, callback) {
                data.error = new Error('Invalid bit.');
                
                callback();
            });
        }
        
        model.plugin(plugin);
        
        model.create(function(err, doc) {
            expect(err).to.be.null;
            
            doc.name = 'Marco';
            
            doc.save(function(err) {
                model.findOne({name : 'Marco'}, function(err, doc) {
                    expect(err).to.be.an('object');
                    expect(err.constructor.name).to.equal('OsmosError');
                    expect(err.message).to.equal('Invalid bit.');
                    
                    expect(doc).to.be.undefined;
                    
                    done();
                });
            });
        });        
    });

    it('should allow attaching to the didFindOne hook', function(done) {
        var model = new Model(schema, '', db);
        
        function plugin(model) {
            model.hook('didFindOne', function(data, callback) {
                expect(data.document).to.be.an('object');
                expect(data.document.constructor.name).to.equal('OsmosDocument');
                
                data.document.name = 'New Marco';
                
                callback();
            });
        }
        
        model.plugin(plugin);
        
        model.create(function(err, doc) {
            expect(err).to.be.null;
            
            doc.name = 'Marco';
            
            doc.save(function(err) {
                model.findOne({name : 'Marco'}, function(err, doc) {
                    expect(err).to.be.null;
                    
                    expect(doc).to.be.an('object');
                    expect(doc.constructor.name).to.equal('OsmosDocument');
                    
                    expect(doc.name).to.equal('New Marco');
                    
                    done();
                });
            });
        });        
    });

    it('should allow attaching to the willFind hook', function(done) {
        var model = new Model(schema, '', db);
        
        function plugin(model) {
            model.hook('willFind', function(data, callback) {
                data.error = new Error('Invalid bit.');
                
                callback();
            });
        }
        
        model.plugin(plugin);
        
        model.create(function(err, doc) {
            expect(err).to.be.null;
            
            doc.name = 'Marco';
            
            doc.save(function(err) {
                model.find({name : 'Marco'}, function(err, doc) {
                    expect(err).to.be.an('object');
                    expect(err.constructor.name).to.equal('OsmosError');
                    expect(err.message).to.equal('Invalid bit.');
                    
                    expect(doc).to.be.undefined;
                    
                    done();
                });
            });
        });        
    });

    it('should allow attaching to the didFind hook', function(done) {
        var model = new Model(schema, '', db);
        
        function plugin(model) {
            model.hook('didFind', function(data, callback) {
                expect(data.document).to.be.an('object');
                expect(data.document.constructor.name).to.equal('OsmosDocument');
                
                data.document.name = 'New Marco';
                
                callback();
            });
        }
        
        model.plugin(plugin);
        
        model.create(function(err, doc) {
            expect(err).to.be.null;
            
            doc.name = 'Marco';
            
            doc.save(function(err) {
                model.findOne({name : 'Marco'}, function(err, doc) {
                    expect(err).to.be.null;
                    
                    expect(doc).to.be.an('object');
                    expect(doc.constructor.name).to.equal('OsmosDocument');
                    
                    expect(doc.name).to.equal('New Marco');
                    
                    done();
                });
            });
        });        
    });
    
    it('should allow attaching to the willDelete hook', function(done) {
        var model = new Model(schema, '', db);
        
        function plugin(model) {
            model.hook('willDelete', function(data, callback) {
                data.error = new Error('Invalid bit.');
                
                callback();
            });
        }
        
        model.plugin(plugin);
        
        model.create(function(err, doc) {
            expect(err).to.be.null;
            
            doc.name = 'Marco 123';
            
            doc.save(function(err) {
                expect(err).to.be.null;
                
                model.delete({name : 'Marco 123'}, function(err, count) {
                    expect(err).to.be.an('object');
                    expect(err.constructor.name).to.equal('OsmosError');
                    expect(err.message).to.equal('Invalid bit.');
                    
                    expect(count).to.equal(0);
                    
                    done();
                });
            });
        });        
    });
    
    it('should allow attaching to the didDelete hook', function(done) {
        var model = new Model(schema, '', db);
        
        function plugin(model) {
            model.hook('didDelete', function(data, callback) {
                data.count += 1;
                
                callback();
            });
        }
        
        model.plugin(plugin);
        
        model.create(function(err, doc) {
            expect(err).to.be.null;
            
            doc.name = 'Marco 1234';
            
            doc.save(function(err) {
                expect(err).to.be.null;
                
                model.delete({name : 'Marco 1234'}, function(err, count) {
                    expect(err).to.be.null;
                    
                    expect(count).to.equal(2);
                    
                    done();
                });
            });
        });        
    });

});