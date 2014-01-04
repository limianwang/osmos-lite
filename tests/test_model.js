'use strict';

var async = require('async');
var expect = require('chai').expect;

var Osmos = require('../lib');

var Schema = Osmos.Schema;
var Model = Osmos.Model;

var schema, model;

describe('The Model class', function() {
  
  before(function() {
    var db = new Osmos.drivers.Memory();
    
    db.post({}, { name : 'Marco' , toJSON : function() { return { name : 'Marco' }; } }, function() {});
    
    Osmos.drivers.register('memory', db);

    schema = new Schema(
      'test',
      {
        type: 'object',
        properties: {
          _primaryKey: {
            type: 'string',
          },
          
          val: {
            type: 'string',
            format: 'email'
          }
        }
      }
    );
    
    schema.primaryKey = '_primaryKey';
    
    model = new Model('TestModel', schema, '', 'memory');
  });
  
  it('should exist', function() {
    expect(Model).to.be.a('function');
  });
  
  it('should support both direct and named drivers', function() {
    function f() {
      new Model('TestModel', schema, '', 'memory');
      new Model('TestModel', schema, '', new Osmos.drivers.Memory());
    }
    
    expect(f).not.to.throw(Error);
  });
  
  it('should allow the creation of new documents', function(done) {
    model.create(function(err, doc) {
      expect(err).not.to.be.ok; // jshint ignore:line
      expect(doc).to.be.an('object');
          
      done();
    });
  });

  it('should allow finding multiple documents', function(done) {
    model.find({ name : 'Marco' }, function(err, docs) {
      expect(err).to.equal(null);
      expect(docs).to.be.an('array');
      expect(docs).to.have.length(1);
      done();
    });
  });

  it('should find one document', function(done) {
    model.findOne({ name : 'Marco' }, function(err, doc) {
      expect(err).to.equal(null);
      expect(doc).to.be.an('object');
      expect(doc.constructor.name).to.equal('OsmosDocument');
          
      done();
    });
  });

  it('should support get-or-create', function(done) {
    expect(model.getOrCreate).to.be.a('function');

    var primaryKey;

    async.waterfall(
      [
        function(cb) {
          model.create(cb);
        },

        function(doc, cb) {
          doc.val = 'marcot@tabini.ca';
          doc.save(cb);
        },

        function(doc, cb) {
          primaryKey = doc.primaryKey;
          model.getOrCreate(doc.primaryKey, cb);
        },

        function(doc, created, cb) {
          expect(created).to.be.false;
          expect(doc).to.be.an('object');
          expect(doc.primaryKey).to.equal(primaryKey);

          model.getOrCreate('completelyRandom', cb);
        },

        function(doc, created, cb) {
          expect(created).to.be.true;
          expect(doc).to.be.an('object');
          expect(doc.primaryKey).to.equal('completelyRandom');

          cb();
        }
      ],

      done
    );
  });
  
});