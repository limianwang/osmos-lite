'use strict';

var es = require('elasticsearch');

var objectDiff = require('../util/objectdiff');
var OsmosError = require('../util/error');

var Driver = function OsmosElasticDriver(options, index) {
  this.client = es.Client(options);
  this.index = index;
};

Driver.prototype = {

  create : function create(model, callback) {
    callback(null, {});
  },

  get : function get(model, key, callback) {
    this.client.get(
      {
        index: this.index,
        type: model.bucket,
        id: key
      },

      function(err, result) {
        if (err) {
          callback(err);
          return;
        }

        result._source[model.schema.primaryKey] = result._id;

        callback(null, result._source);
      }
    );
  },

  post : function post(document, data, callback) {
    var payload = {
      index: this.index,
      type: document.model.bucket,
      body: data,
      published: true,
      refresh: true,
      consistency: 'quorum'
    };

    if (document.primaryKey) {
      payload.id = document.primaryKey;
    }

    this.client.index(
      payload, 

      function(err, result) {
        if (err) {
          callback(err);
          return;
        }

        document.primaryKey = result._id;
        callback(null);
      }
    );
  },

  put : function put(document, data, callback) {
    var self = this;

    process.nextTick(function() {
      if (!document.model.schema.primaryKey || !document.primaryKey) {
        throw new OsmosError('You cannot put a document without a primary key');
      }

      if (document.__originalData__[document.model.schema.primaryKey] === undefined) {
        return self.post(document, data, callback);
      }

      var changes = objectDiff.diff(document.__originalData__, data);

      if (changes.changed === 'equal') return callback(null); // Nothing to update.

      var diff = {};
      var set = {};
      var unset = {};
          
      Object.keys(changes.value).forEach(function(key) {
        var val = data[key];

        if (changes.value[key].changed !== 'equal') {
          diff[key] = val;

          if (val === undefined) {
            unset[key] = '';
          } else {
            set[key] = val;
          }
        }
      });
      
      var primaryKey;
      
      if (diff[document.schema.primaryKey]) {
        primaryKey = document.__originalData__[document.schema.primaryKey];
      } else {
        primaryKey = document.primaryKey;
      }
      
      var payload = {
        index: self.index,
        type: document.model.bucket,
        consistency: 'quorum',
        refresh: true,
        body: {
          doc: diff
        },
        id: primaryKey
      };

      self.client.update(payload, callback);

    });
  },

  del : function deleteRecord(model, key, callback) {
    if (key.constructor.name === 'Object') {
      key = key[Object.keys(key)[0]];
    }

    this.client.delete(
      {
        index: this.index,
        type: model.bucket,
        id: key
      },

      callback
    );
  },

  findOne : function findOne(model, spec, callback) {
    spec.index = this.index;
    spec.type = model.bucket;
    spec.size = 1;

    this.client.search(spec, function(err, result) {
      if (err) {
        callback(err);
        return;
      }

      var records = result.hits.hits;

      records = records.map(function(record) {
        record._source[model.schema.primaryKey] = record._id;

        return record._source;
      });

      if (records.length) {
        callback(null, records[0]);
      } else {
        callback(null, null);
      }
    });
  },

  find : function find(model, spec, callback) {
    spec.index = this.index;
    spec.type = model.bucket;
    spec.size = 9999999;

    this.client.search(spec, function(err, result) {
      if (err) {
        callback(err, []);
        return;
      }

      var records = result.hits.hits;

      records = records.map(function(record) {
        record._source[model.schema.primaryKey] = record._id;

        return record._source;
      });

      callback(null, records);
    });
  },

  findLimit : function findLimit(model, spec, start, limit, callback) {
    spec.index = this.index;
    spec.type = model.bucket;
    spec.from = start;
    spec.size = limit;

    this.client.search(spec, function(err, result) {
      if (err) {
        callback(err, []);
        return;
      }

      var records = result.hits.hits;

      records = records.map(function(record) {
        record._source[model.schema.primaryKey] = record._id;

        return record._source;
      });

      callback(
        null, 
        {
          docs: records,
          count: result.hits.total,
          start: start,
          limit: limit
        }
      );
    });
  },

};

module.exports = Driver;