'use strict';

var Promise = require('native-or-bluebird');
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

Driver.prototype.create = function(model, done) {
  return new Promise(function(resolve) {
    return resolve({});
  }).nodeify(done);
};

Driver.prototype.get = function(model, key, done) {
  var self = this;
  return new Promise(function(resolve, reject) {
    var spec = {
      _id: mongoKey(key)
    };

    return self.database.collection(model.bucket).findOne(spec, function(err, doc) {
      if(err) {
        reject(err);
      } else {

        if(doc) {
          doc._id = doc._id.toHexString ? doc._id.toHexString() : doc._id;
        }

        resolve(doc);
      }
    });
  }).nodeify(done);
};

Driver.prototype.post = function(document, data, done) {
  data._id = mongoKey(data._id);
  var self = this;
  return new Promise(function(resolve, reject) {
    return self.database.collection(document.model.bucket).insert(data, function(err, docs) {
      if(err) {
        reject(err);
      } else {
        document.primaryKey = docs[0]._id.toHexString ? docs[0]._id.toHexString() : docs[0]._id;
        resolve();
      }
    });
  }).nodeify(done);
};

Driver.prototype.put = function(document, data, done) {
  var self = this;

  return new Promise(function(resolve, reject) {
    if(!(document.model.schema.primaryKey && document.primaryKey)) {
      return reject(new OsmosError('You cannot put a document without a primary key'));
    }

    if(document.__originalData__[document.model.schema.primaryKey] === undefined) {
      return self.post(document, data).then(function() {
        resolve();
      }).catch(function(err) {
        resolve(err);
      });
    }

    var changes = objectDiff.diff(document.__originalData__, data);

    if(changes.changed === 'equal') {
      // nothing to update
      return resolve();
    }

    var diff = {};
    var set = {};
    var unset = {};

    Object.keys(changes.value).forEach(function(k) {
      var v = data[k];

      if(changes.value[k].changed !== 'equal') {
        diff[k] = v;

        if(v === undefined) {
          unset[k] = '';
        } else {
          set[k] = v;
        }
      }
    });

    var primaryKey;

    if(diff[document.schema.primaryKey]) {
      primaryKey = document.__originalData__[document.schema.primaryKey];
    } else {
      primaryKey = document.primaryKey;
    }

    var payload = {};

    if (Object.keys(set).length) {
      payload.$set = set;
    }

    if (Object.keys(unset).length) {
      payload.$unset = unset;
    }

    return self.database.collection(document.model.bucket).update({
      _id: mongoKey(primaryKey)
    }, payload, { upsert: true }, function(err) {
      if(err) {
        reject(err);
      } else {
        resolve();
      }
    });
  }).nodeify(done);
};

Driver.prototype.del = function(model, key, done) {
  if (key.constructor.name === 'Object') {
    key = key[Object.keys(key)[0]];
  }

  var self = this;

  return new Promise(function(resolve, reject) {
    return self.database.collection(model.bucket).remove({
      _id: mongoKey(key)
    }, function(err) {
      if(err) {
        reject(err);
      } else {
        resolve();
      }
    });
  }).nodeify(done);
};

Driver.prototype.count = function(model, spec, done) {
  var self = this;
  return new Promise(function(resolve, reject) {
    return self.database.collection(model.bucket).find(spec).count(function(err, count) {
      if(err) {
        reject(err);
      } else {
        resolve(count);
      }
    });
  }).nodeify(done);
};

Driver.prototype.findOne = function(model, spec, done) {
  var self = this;
  return new Promise(function(resolve, reject) {
    return self.database.collection(model.bucket).findOne(spec, function(err, doc) {
      if(err) {
        reject(err);
      } else {
        resolve(doc);
      }
    });
  }).nodeify(done);
};

Driver.prototype.find = function(model, spec, done) {
  var self = this;
  return new Promise(function(resolve, reject) {
    return self.database.collection(model.bucket).find(spec, function(err, rs) {
      if(err) {
        reject(err);
      } else {
        rs.toArray(function(err, docs) {
          if(err) {
            reject(err);
          } else {
            resolve(docs);
          }
        });
      }
    });
  }).nodeify(done);
};

Driver.prototype.findLimit = function findLimit(model, spec, start, limit, done) {
  var self = this;
  var searchSpec = spec.$query ? spec.$query : spec;

  return new Promise(function(resolve, reject) {
    async.parallel({
      count: function(cb) {
        self.database.collection(model.bucket).find(searchSpec).count(cb);
      },
      docs: function(cb) {
        self.database.collection(model.bucket).find(spec).skip(start).limit(limit, function(err, rs) {
          if (err) return cb(err);

          rs.toArray(cb);
        });
      }
    }, function(err, result) {
      if (err) return (err);
      if(err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  }).nodeify(done);

};
module.exports = Driver;
