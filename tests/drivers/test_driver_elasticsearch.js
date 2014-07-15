/*jshint expr:true*/

'use strict';

var Osmos = require('../../lib');
var Schema = Osmos.Schema;
var Model = Osmos.Model;

var ElasticSearch = Osmos.drivers.ElasticSearch;

var expect = require('chai').expect;
var async = require('async');

var model;

var schema = new Schema(
  'elasticsearch',
  {
    type: 'object',
    required: [ 'name', 'email' ],
    properties: {
      name: {
        type: 'string'
      },
      email: {
        type: 'string',
        format: 'email'
      },
      id: {
        type: 'string'
      }
    }
  }
);

schema.primaryKey = 'id';

describe('The ElasticSearch driver', function() {
   
  before(function(done) {
    var driver = new ElasticSearch(
      {
        host: 'localhost:9200'
      },

      'osmostest'
    );

    driver.client.indices.delete(
      {
        index: 'osmostest'
      },

      function(err) {
        if (err) expect(err).to.match(/IndexMissingException/);

        Osmos.drivers.register('elasticsearch', driver);

        model = new Model('ESPerson', schema, 'person', 'elasticsearch');
        
        model.transformers._id = {
          get: function(value) {
            if (!value) return value;
            
            return value.toHexString ? value.toHexString() : value;
          }
        };

        done();
      }
    );
  });
    
  it('should allow creating new documents', function(done) {
    model.create(function(err, doc) {
      expect(err).not.to.be.ok;
            
      expect(doc).to.be.an('object');
      expect(doc.constructor.name).to.equal('OsmosDataStoreDocument');
            
      done();
    });
  });
    
  it('should allow posting documents and reading their key', function(done) {
    model.create(function(err, doc) {
      doc.name = 'Marco';
      doc.email = 'marcot@tabini.ca';
            
      expect(doc.primaryKey).to.equal(undefined);
      
      doc.save(function(err) {
        expect(err).to.be.undefined;
                
        expect(doc.primaryKey).not.to.equal(undefined);
                
        done();
      });
    });
  });
    
  it('should allow putting documents and reading their key', function(done) {
    model.create(function(err, doc) {
      doc.name = 'Marco';
      doc.email = 'marcot@tabini.ca';
            
      var key = 'Test Key' + Math.random();
      
      doc.primaryKey = key;
      
      doc.save(function(err) {
        expect(err).to.not.be.ok;
        
        expect(doc.primaryKey).to.equal(key);
                
        done();
      });
    });
  });
    
  it('should allow updating individual fields independently', function(done) {
    model.create(function(err, doc) {
      expect(err).not.to.be.ok;
            
      doc.name = 'Manu';
      doc.email = 'manu@example.org';
            
      doc.save(function(err) {
        expect(err).to.not.be.ok;
        
        model.get(doc.primaryKey, function(err, doc2) {
          async.parallel(
            [
              function(cb) {
                doc2.name = 'Joe';
                doc2.save(cb);
              },
                            
              function(cb) {
                doc.email = 'joe@example.org';
                doc.save(cb);
              },
            ],
                        
            function(err) {
              expect(err).not.to.be.ok;
                            
              model.get(doc.primaryKey, function(err, doc3) {
                expect(err).not.to.be.ok;
                
                expect(doc3).to.be.an('object');
                expect(doc3.name).to.equal('Joe');
                expect(doc3.email).to.equal('joe@example.org');
                            
                done();
              });
            }
          );
                    
        });
      });
    });
  });
    
  it('should allow putting and retrieving documents by their key', function(done) {
    model.create(function(err, doc) {
      doc.name = 'Marco';
      doc.email = 'marcot@tabini.ca';
            
      var key = 'Test Key' + Math.random();
      
      doc.primaryKey = key;
      
      doc.save(function(err) {
        expect(err).to.not.be.ok;
        
        model.get(key, function(err, doc) {
          expect(err).to.not.be.ok;
          
          expect(doc).to.be.an('object');
          expect(doc.constructor.name).to.equal('OsmosDataStoreDocument');
                    
          expect(doc.name).to.equal('Marco');
          expect(doc.email).to.equal('marcot@tabini.ca');
                    
          done();
        });
      });
    });
  });
    
  it('should allow deleting documents by their key', function(done) {
    model.create(function(err, doc) {
      doc.name = 'Marco';
      doc.email = 'marcot@tabini.ca';
            
      doc.save(function(err) {
        expect(err).to.not.be.ok;
                
        expect(doc.primaryKey).not.to.equal(undefined);

        doc.del(function(err) {
          expect(err).to.not.be.ok;
                    
          model.get(doc.primaryKey, function(err, doc) {
            expect(doc).to.equal(undefined);

            done();
          });
        });
      });
    });
  });
    
  it('should allow querying for individual documents', function(done) {
    model.create(function(err, doc) {
      doc.name = 'Marco';
      doc.email = 'marcot@tabini.ca';
            
      doc.save(function() {
        model.findOne(
          {
            q: 'email:"marcot@tabini.ca"'
          },
                    
          function(err, result) {
            expect(err).to.not.be.ok;

            expect(result).to.be.an('object');
            expect(result.email).to.equal('marcot@tabini.ca');

            done();
          }
        );
      });
    });
  });
        
  it('should return multiple documents when using find()', function(done) {
    async.series(
      [
        function(cb) {
          model.create(function(err, doc) {
            expect(err).not.to.be.ok;
            
            doc.name = 'Marco';
            doc.email = 'marcot@tabini.ca';
            doc.save(cb);
          });
        },
        
        function(cb) {
          model.create(function(err, doc) {
            expect(err).not.to.be.ok;

            doc.name = 'Marco';
            doc.email = 'marcot@tabini.ca';
            doc.save(cb);
          });
        },
        
        function(cb) {
          model.find(
            {
              q: 'email:"marcot@tabini.ca"'
            },
            
            function(err, docs) {
              expect(err).not.to.be.ok;
              
              expect(docs).to.be.an('array');
              expect(docs.length).to.be.above(1);
              
              cb(null);
            }
          );
        }
      ],
      
      done
    );
  });
    
  it('should return document metadata when using findLimit()', function(done) {
    var email = 'marcot-' + Math.random() + '@tabini.ca';
    
    this.timeout(15000);
    
    async.series(
      [
        function(cb) {
          async.each(
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],

            function(datum, cb) {
              model.create(function(err, doc) {
                expect(err).not.to.be.ok;
            
                doc.name = 'Marco';
                doc.email = email;
                doc.save(cb);
              });
            },

            cb
          );
        },
        
        function(cb) {
          model.findLimit(
            {
              q: 'email:"' + email + '"'
            },
            
            0,
            
            2,
            
            function(err, result) {
              expect(err).not.to.be.ok;
              
              expect(result).to.be.an('object');
              
              expect(result.count).to.equal(10);
              expect(result.start).to.equal(0);
              expect(result.limit).to.equal(2);
              expect(result.docs).to.be.an('array');
              expect(result.docs.length).to.equal(2);
              
              cb(null);
            }
          );
        }
      ],
      
      done
    );
  });

  it('should properly skip documents when using findLimit()', function(done) {
    var email = 'marcot-' + Math.random() + '@tabini.ca';
    
    this.timeout(15000);
    
    async.series(
      [
        function(cb) {
          async.each(
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],

            function(datum, cb) {
              model.create(function(err, doc) {
                expect(err).not.to.be.ok;
            
                doc.name = 'Marco';
                doc.email = email;
                doc.save(cb);
              });
            },

            cb
          );
        },
        
        function(cb) {
          model.findLimit(
            {
              q: 'email:"' + email + '"'
            },
            
            2,
            
            10,
            
            function(err, result) {
              expect(err).not.to.be.ok;
              
              expect(result).to.be.an('object');
              
              expect(result.count).to.equal(10);
              expect(result.start).to.equal(2);
              expect(result.limit).to.equal(10);
              expect(result.docs).to.be.an('array');
              expect(result.docs.length).to.equal(8);
              
              cb(null);
            }
          );
        }
      ],
      
      done
    );
  });

it('should properly manage count with findLimit() when using a sort operation', function(done) {
  var email = 'marcot-' + Math.random() + '@tabini.ca';
  
  this.timeout(15000);
  
  async.series(
    [
      function(cb) {
        async.each(
          [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],

          function(datum, cb) {
            model.create(function(err, doc) {
              expect(err).not.to.be.ok;
          
              doc.name = 'Marco';
              doc.email = email;
              doc.save(cb);
            });
          },

          cb
        );
      },
      
      function(cb) {
        model.findLimit(
          {
            q: 'email:"' + email + '"'
          },
          
          2,
          
          10,
          
          function(err, result) {
            expect(err).not.to.be.ok;
            
            expect(result).to.be.an('object');
            
            expect(result.count).to.equal(10);
            expect(result.start).to.equal(2);
            expect(result.limit).to.equal(10);
            expect(result.docs).to.be.an('array');
            expect(result.docs.length).to.equal(8);
            
            cb(null);
          }
        );
      }
    ],
    
    done
  );
});

});