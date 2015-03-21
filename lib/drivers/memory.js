'use strict';

var OsmosError = require('../util/error');
var crypto = require('crypto');
var Driver = function OsmosMemoryDriver() {
  this.data = {};
};

function matchSpec(target, spec) {
  return Object.keys(spec).every(function(key) {
    var value = spec[key];

    if (typeof value === 'number') {
      return Number(target[key]) === spec[key];
    } else {
      return String(target[key]).match(spec[key]);
    }
  });
}

Driver.prototype = {
  create: function create(model, callback) {
    process.nextTick(function() {
      callback(null, {});
    });
  },
  get: function get(model, primaryKey, callback) {
    if(this.data[primaryKey]) {
      callback(null, this.data[primaryKey]);
    } else {
      callback(null);
    }
  },
  post: function post(document, data, callback) {
    if(document.primaryKey) {
      return callback(new OsmosError('You cannot call post on an object that already has a primary key. Clone it first.'));
    }

    var primaryKey = crypto.randomBytes(20).toString('hex');

    document.primaryKey = primaryKey;
    data._primaryKey = primaryKey;

    this.data[primaryKey] = data;

    process.nextTick(function() {
      callback(null);
    });
  },
  put : function put(document, data, callback) {
    var primaryKey = document.primaryKey;

    if (!this.data[primaryKey]) return callback(null, undefined);

    this.data[primaryKey] = data;

    callback(null);
  },
  del: function deleteRecord(model, spec, callback) {
    var self = this;

    this.find(model.bucket, spec, function(err, results) {
      if(err) {
        process.nextTick(function() {
          callback(err);
        });

        return;
      }

      results.forEach(function(result) {
        delete self.data[result._primaryKey];
      });

      process.nextTick(function() {
        callback(null, results.length);
      });
    });
  },
  findOne : function findOne(model, spec, callback) {
    var result = null;
    var _this = this;

    Object.keys(this.data).every(function(key) {
      var record = _this.data[key];

      if (matchSpec(record, spec)) {
        result = record;
        return false;
      }

      return true;
    });

    process.nextTick(function() {
      callback(null, result);
    });
  },
  find : function find(model, spec, callback) {
    var result = [];

    Object.keys(this.data).forEach(function(key) {
      var record = this.data[key];

      if (matchSpec(record, spec)) {
        result.push(record);
      }
    }, this);

    process.nextTick(function() {
      callback(null, result);
    });
  },
  count: function count(model, spec, callback) {
    var count;
    this.find(this, spec, function(err, docs) {
      if(err) {
        callback(err);
      } else {
        callback(null, docs.length);
      }
    });
  }
};

module.exports = Driver;
