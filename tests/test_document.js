/*jshint expr:true*/

'use strict';

var async = require('async');

var expect = require('chai').expect;

var Osmos = require('../lib');

var Schema = Osmos.Schema;
var Model = Osmos.Model;
var Document = Osmos.Document;

var schema, model;

describe('The Document class', function() {
  
  before(function() {
    var db = new Osmos.drivers.Memory();
    
    Osmos.drivers.register('memory', db);

    schema = new Schema(
      'test',
      {
        type: 'object',
        required: [ 'name', 'val' ],
        properties: {
          _primaryKey: {
            type: 'string',
          },
          
          name: {
            type: 'string'
          },
          
          age: {
            type: 'number',
            minimum: 0,
            maximum: 99
          },
          
          val: {
            type: 'number',
            minimum: 1,
            maximum: 2,
          },
          
          last_update: {                    //jshint ignore:line
            type: 'number'
          }
        }
      }
    );
    
    schema.transformers.val = {
      get: function(value) {
        switch(value) {
        case 1:
          return 'one';
            
        case 2:
          return 'two';
            
        default:
          return value;
        }
      },
      
      set: function(value) {
        switch(value) {
        case 'one':
          return 1;
            
        case 'two':
          return 2;
            
        default:
          throw new Error('Invalid value `' + value + '`');
        }
      }
    };
    
    schema.primaryKey = '_primaryKey';
    
    schema.hook('didValidate', function(payload, cb) {
      if (payload.name == 'fail') return cb(new Osmos.Error('The chicken has fled the coop. I repeat, the chicken has fled the coop.'));
      
      cb();
    });
    
    model = new Model('TestModel', schema, '', 'memory');
    
    model.instanceMethods.testFunction = function() {
      return 'ok';
    };
    
    model.instanceProperties.testProperty = 1;
    
    model.updateableProperties = {'name' : 1};
    
    model.hook('didUpdate', function(payload, cb) {
      payload.doc.last_update = new Date().getTime(); // jshint ignore:line
      
      cb();
    });
  });
  
  it('should exist', function() {
    expect(Document).to.be.a('function');
  });

  it('should allow writing to properly declared fields', function(done) {
    model.create(function(err, doc) {
      expect(doc).to.be.an('object');
      expect(doc.constructor.name).to.equal('OsmosDocument');

      function test() {
        doc.name = 'marco';
      }
    
      expect(test).not.to.throw(Osmos.Error);
    
      done();
    });
  });

  it('should refuse writing to a non-existing field', function(done) {
    model.create(function(err, doc) {
      expect(doc).to.be.an('object');
      expect(doc.constructor.name).to.equal('OsmosDocument');
          
      function test() {
        doc.name = 'marco';
        doc.invalid = 'value';
      }
          
      expect(test).to.throw(Error);
          
      done();
    });
  });
  
  it('should allow reading from a declared field', function(done) {
    function test() {
      model.create(function(err, doc) {
        doc.name = 'marco';
            
        expect(doc.name).to.equal('marco');
                
        done();
      });
    }
        
    expect(test).not.to.throw(Osmos.Error);
  });
  
  it('should perform transformations when reading and writing data', function(done) {
    model.create(function(err, doc) {
      doc.val = 'one';
          
      expect(doc.__raw__.val).to.equal(1);
          
      expect(doc.val).to.equal('one');
      done();
    });
  });
  
  it('should allow saving a document', function(done) {
    model.create(function(err, doc) {
      doc.name = 'marco';
      doc.val = 'one';
      
      doc.save();
      done();
    });
  });
  
  it('should not require a callback when saving a document', function(done) {
    model.create(function(err, doc) {
      doc.name = 'marco';
      doc.val = 'one';
      
      doc.save(function(err) {
        expect(err).to.equal(null);
                
        done();
      });
    });
  });
  
  it('should actually save a document', function(done) {
    async.waterfall(
      [
        function(callback) {
          model.create(callback);
        },
              
        function(doc, callback) {
          doc.name = 'marco';
          doc.val = 'one';
                  
          doc.save(function(err) {
            expect(err).to.equal(null);
            
            callback(null, doc.primaryKey);
          });
        },
              
        function(primaryKey, callback) {
          model.get(primaryKey, function(err, doc) {
            callback(err, doc, primaryKey);
          });
        },
              
        function(doc, primaryKey, callback) {
          expect(doc).to.be.an('object');
          expect(doc.constructor.name).to.equal('OsmosDocument');
                  
          expect(doc.name).to.be.a('string');
          expect(doc.name).to.equal('marco');
                  
          expect(doc.val).to.be.a('string');
          expect(doc.val).to.equal('one');
                  
          expect(doc.primaryKey).to.be.a('string');
          expect(doc.primaryKey).to.equal(primaryKey);
                  
          callback(null);
        }
      ],
          
      done
    );
  });
  
  it('should call the global validator before saving', function(done) {
    model.create(function(err, doc) {
      doc.name = 'fail';
      doc.val = 'one';
          
      doc.save(function(err) {
        expect(err).to.be.an('object');
        expect(err).to.be.an.instanceOf(Osmos.Error);
              
        done();
      });
    });
  });
  
  it('should properly delete a document', function(done) {
    async.waterfall(
      [
        function(callback) {
          model.create(callback);
        },
              
        function(doc, callback) {
          doc.name = 'marco';
          doc.val = 'one';
                  
          doc.save(function(err) {
            expect(err).to.equal(null);
                      
            callback(err, doc);
          });
        },
              
        function(doc, callback) {
          doc.del(function(err) {
            callback(err, doc.primaryKey);
          });
        },
              
        function(primaryKey, callback) {
          model.get(primaryKey, function(err, doc) {
            expect(err).to.equal(null);
            expect(doc).to.equal(undefined);
                      
            callback(null);
          });
        }
      ],
          
      function(err) {
        expect(err).to.equal(null);
              
        done();
      }
    );
  });
  
  it('should support extension through the instanceMethods property', function(done) {
    model.create(function(err, doc) {
      expect(err).not.to.be.ok;
      expect(doc).to.be.an('object');
      
      expect(doc.testFunction).to.be.a('function');
      expect(doc.testFunction()).to.equal('ok');
      
      done();
    });
  });
  
  it('should support extension through the instanceProperties property', function(done) {
    model.create(function(err, doc) {
      expect(err).not.to.be.ok;
      expect(doc).to.be.an('object');
      
      function f() {
        doc.testProperty = 123;
        expect(doc.testProperty).to.equal(123);
      }
      
      expect(f).not.to.throw(Osmos.Error);
      
      done();
    });
  });
  
  it('should support updating a document from a JSON payload', function(done) {
    model.create(function(err, doc) {
      expect(err).not.to.be.ok;
      expect(doc).to.be.an('object');
      
      doc.update({name : 'Marco'}, function(err) {
        expect(err).not.to.be.ok;
        expect(doc.name).to.equal('Marco');
        
        done();
      });
    });
  });
  
  it('should support update hooks when updating a document', function(done) {
    model.create(function(err, doc) {
      expect(err).not.to.be.ok;
      expect(doc).to.be.an('object');
      
      doc.update({name : 'Marco'}, function(err) {
        expect(err).not.to.be.ok;
        expect(doc.name).to.equal('Marco');
        expect(doc.last_update).to.be.above(0); // jshint ignore:line
        
        done();
      });
    });
  });

  it('should support setting a value to undefined', function(done) {
    function test() {
      model.create(function(err, doc) {
        doc.name = undefined;

        done();
      });
    }

    expect(test).not.to.throw(Error);
  });

  it('should support referenced properties (#7)', function(done) {
    var s1 = {
      id: 'http://example.com/s1',
      properties:{
        type: {
          type: 'string',
          enum:['a','b']
        }
      },
      required: ['type']
    };

    var s2 = {
      id: 'http://example.com/s2',
      properties: {
        name: {
          type: 'string'
        },
      },
      required: ['name'],
      allOf:[{$ref : 'http://example.com/s1' }]
    };

    Schema.registerSchema(s1.id, s1);

    var localSchema = new Schema(s2.id, s2);

    localSchema.primaryKey = 'type';

    var localModel = new Model('LocalModel', localSchema, '', 'memory');

    function test (doc) {
      doc.type = 'a';
      var x = doc.type;
      x = x;
    }

    localModel.create(function(err, doc) {
      expect(err).not.to.be.ok;
      expect(doc).to.be.an('object');

      expect(test.bind(this, doc)).not.to.throw(Error);

      done();
    });
  });
  
});