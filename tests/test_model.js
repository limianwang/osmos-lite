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
          },

          meta: {
            type: 'object',
            default: {}
          },

          is_valid: {
            type: 'boolean',
            default: false
          },

          environment: {
            enum: ['a', null],
            default: null
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

  it('should throw error when no primaryKey specified', function() {
    var primaryKey = schema.primaryKey;
    schema.primaryKey = null;

    function wrap() {
      return new Model('fake', schema, '', 'memory');
    }

    expect(wrap).to.throw(Error);

    schema.primaryKey = primaryKey;
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
      expect(err).to.not.be.ok;
      expect(docs).to.be.an('array');
      expect(docs).to.have.length(1);
      done();
    });
  });

  it('should find one document', function(done) {
    model.findOne({ name : 'Marco' }, function(err, doc) {
      expect(err).to.not.be.ok;
      expect(doc).to.be.an('object');
      expect(doc.constructor.name).to.equal('OsmosDataStoreDocument');

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
          expect(doc).to.have.property('meta').to.deep.equal({});
          expect(doc).to.have.property('is_valid').to.be.equal(false);

          cb(null);
        }
      ],

      done
    );
  });

  it('should support creation from immediate data', function(done) {
    expect(model.getFromImmediateData).to.be.a('function');

    var data = {
      _primaryKey: '123123',
      val: 'john@example.com',
      is_valid: true
    };

    model.getFromImmediateData(data, function(err, doc) {
      expect(err).not.be.ok;
      expect(doc).to.have.property('is_valid').to.be.equal(true);
      expect(doc.toRawJSON()).to.deep.equal(data);

      done();
    });
  });

  it('should support counting the number of occurrences', function(done) {
    expect(model).to.respondTo('count');

    model.count({ name: 'Marco' }, function(err, count) {
      expect(err).to.not.exist;
      expect(count).to.be.equal(1);
      done();
    });

  });
});
