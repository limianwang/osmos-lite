'use strict';

var async = require('async');
var mongo = require('mongodb');

var ObjectID = mongo.ObjectID;

var objectDiff = require('../util/objectdiff');
var OsmosError = require('../util/error');


function mongoKey(key) {
  if (!key || key.constructor.name == 'ObjectID') return key;

  try {
    return new ObjectID(key);
  } catch (e) {
    return key;
  }
}

var Driver = function OsmosMongoDriver(database) {
  this.database = database;
};

Driver.prototype = {

  create : function create(model, cb) {
    process.nextTick(function() {
      cb(null, {});
    });
  },

  get : function get(model, key, cb) {
    this.database.collection(model.bucket).findOne(
    {
      _id: mongoKey(key)
    },

    function(err, doc) {
      if (err) return cb(err);

      if (doc) {
        doc._id = doc._id.toHexString ? doc._id.toHexString() : doc._id;
      }

      cb(null, doc);
    }
    );
  },

  post : function post(document, data, cb) {
    data._id = mongoKey(data._id);

    this.database.collection(document.model.bucket).insert(data, function(err, docs) {
      if (err) return cb(err);

      document.primaryKey = docs[0]._id.toHexString ? docs[0]._id.toHexString() : docs[0]._id;

      cb(null);
    });
  },

  put : function put(document, data, cb) {
    var self = this;

    process.nextTick(function() {
      if (!document.model.schema.primaryKey || !document.primaryKey) {
        throw new OsmosError('You cannot put a document without a primary key');
      }

      if (document.__originalData__[document.model.schema.primaryKey] === undefined) {
        return self.post(document, data, cb);
      }

      var changes = objectDiff.diff(document.__originalData__, data);

      if (changes.changed === 'equal') return cb(null); // Nothing to update.
          
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
      
      self.database.collection(document.model.bucket).update(
      {
        _id: mongoKey(primaryKey)
      },

      {
        $set: diff,
      },

      cb
      );
    });
  },

  del : function deleteRecord(model, key, cb) {
    if (key.constructor.name === 'Object') {
      key = key[Object.keys(key)[0]];
    }

    this.database.collection(model.bucket).remove(
    {
      _id: mongoKey(key)
    },

    cb
    );
  },

  findOne : function findOne(model, spec, cb) {
    this.database.collection(model.bucket).findOne(spec, cb);
  },

  find : function find(model, spec, cb) {
    this.database.collection(model.bucket).find(spec, function(err, rs) {
      if (err) return cb(err);

      rs.toArray(cb);
    });
  },

  findLimit : function findLimit(model, spec, start, limit, cb) {
    var self = this;
    var searchSpec = spec.$query ? spec.$query : spec;

    async.parallel(
    {
      count: function(cb) {
        self.database.collection(model.bucket).find(searchSpec).count(cb);
      },
      docs: function(cb) {
        self.database.collection(model.bucket).find(spec).skip(start).limit(limit, function(err, rs) {
          if (err) return cb(err);

          rs.toArray(cb);
        });
      }
    },

    function(err, result) {
      if (err) return cb(err);
      
      cb(err, result);
    }
    );
  }

};

module.exports = Driver;