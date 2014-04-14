'use strict';

var r = require('rethinkdb');

var objectDiff = require('../util/objectdiff');
var OsmosError = require('../util/error');

var Driver = function OsmosRethinkDriver(connection, options) {
  this.connection = connection;
  this.options = options || {};
};

Driver.prototype = {

  create : function create(model, callback) {
    callback(null, {});
  },

  get : function get(model, key, callback) {
    r.table(model.bucket, this.options).get(key).run(this.connection, callback);
  },

  post : function post(document, data, callback) {
    r
    .table(document.model.bucket, this.options)
    .insert(data)
    .run(this.connection, function(err, result) {
      if (err) return callback(err);
      if (result.errors) return callback(new OsmosError('Database insertion error: ' + JSON.stringify(result.first_error))); // jshint ignore:line

      if (result.generated_keys) { // jshint ignore:line
        document.primaryKey = result.generated_keys[0]; // jshint ignore:line
      }

      callback(null);
    });
  },

  put : function put(document, data, callback) {
    if (!document.model.schema.primaryKey || !document.primaryKey) {
      throw new Error('You cannot put a document without a primary key');
    }

    if (document.__originalData__[document.model.schema.primaryKey] === undefined) {
      return this.post(document, data, callback);
    }

    var changes = objectDiff.diff(document.__originalData__, data);

    if (changes.changed === 'equal') return callback(null); // Nothing to update.
    
    var diff = {};
    
    Object.keys(changes.value).forEach(function(key) {
      if (changes.value[key].changed !== 'equal') {
        diff[key] = data[key];
      }
    });
    
    var primaryKey;
    
    if (diff[document.schema.primaryKey]) {
      primaryKey = document.__originalData__[document.schema.primaryKey];
    } else {
      primaryKey = document.primaryKey;
    }
    
    r
    .table(document.model.bucket, this.options)
    .get(primaryKey)
    .update(diff)
    .run(this.connection, function(err, result) {
      if (err) return callback(err);
      if (result.errors) return callback(new OsmosError('Database update error: ' + JSON.stringify(result.first_error))); // jshint ignore:line

      if (diff[document.schema.primaryKey]) {
        document.primaryKey = document.schema.primaryKey; // In case the primary key has changed.
      }

      callback(null);
    });
  },

  del : function deleteRecord(model, key, callback) {
    if (key.constructor.name === 'Object') {
      key = key[Object.keys(key)[0]];
    }

    r
    .table(model.bucket, this.options)
    .get(key)
    .delete()
    .run(this.connection, function(err, result) {
      if (err) return callback(err);
      if (result.errors) return callback(new OsmosError('Database deletion error: ' + JSON.stringify(result.first_error))); // jshint ignore:line

      callback(null);
    });
  },

  findOne : function findOne(model, spec, callback) {
    var table = r.table(model.bucket, this.options);
    
    if (typeof spec === 'function') {
      spec(this.connection, table, callback);
    } else {
      table.getAll(spec.search, { index : spec.index }).limit(1).run(this.connection, function(err, cursor) {
        if (err) return callback(err);

        cursor.toArray(function(err, docs) {
          callback(err, docs.length ? docs[0] : null);
        });
      });
    }
  },

  find : function find(model, spec, callback) {
    var table = r.table(model.bucket, this.options);
    
    if (typeof spec === 'function') {
      spec(this.connection, table, callback);
    } else {
      table.getAll(spec.search, { index : spec.index }).run(this.connection, function(err, cursor) {
        if (err) return callback(err);

        cursor.toArray(function(err, docs) {
          callback(err, docs);
        });
      });
    }
  },

};

module.exports = Driver;