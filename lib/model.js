'use strict';

var Promise = require('native-or-bluebird');
var util = require('util');
var utilities = require('node-helper-utilities');

var OsmosError = require('./util/error');
var objectDiff = require('./util/objectdiff');
var Hookable = require('./util/hookable');
var Document = require('./document');
var drivers = require('./drivers');

var Model = function Model(name, schema, bucket, db) {
  this.schema = schema;
  this.bucket = bucket;
  this.db = typeof db == 'string' ? drivers.instance(db) : db;
  this.name = name;

  this.documentClass = null;
  this.documentClassConstructor = Document;
  this.hasInitializedDocumentClass = false;

  this.instanceMethods = {};
  this.instanceProperties = {};
  this.transformers = {};

  if(!this.schema.primaryKey) {
    throw new OsmosError('Schema is missing a primary key');
  }

  Hookable.call(this);
};

util.inherits(Model, Hookable);

Model.prototype.hooks = [
  'willCount',
  'didCount',
  'didCreate',
  'willFind',
  'didFind',
  'willFindOne',
  'didFindOne',
  'willGet',
  'didGet',
  'willInitialize',
  'didInitialize',
  'willUpdate',
  'didUpdate',
  'willSave',
  'didSave',
  'willDelete',
  'didDelete'
];

Model.prototype.instanceProperties = {};
Model.prototype.instanceMethods = {};
Model.prototype.transformers = {};

Model.prototype.generateDocumentClass = function() {
  this.documentClass = Document.generateClass(
    this.documentClassConstructor,
    this.instanceProperties,
    this.instanceMethods,
    this.transformers,
    this.schema.transformers
  );

  Object.seal(this.instanceMethods);
  Object.seal(this.instanceProperties);
  Object.seal(this.transformers);
};

Model.prototype._initialize = function(data) {
  if (!this.documentClass)
    this.generateDocumentClass();

  var args = {
    data: data,
    documentClass: this.documentClass
  };

  var self = this;

  return this.callHook('willInitialize', args).then(function() {
    args.document = new args.documentClass(self, args.data);
    return Promise.resolve();
  }).then(function() {
    return self.callHook('didInitialize', args);
  }).then(function() {
    return Promise.resolve(args.document);
  });
};

Model.prototype.create = function() {
  var self = this;

  return this.db.create.apply(this).then(function(data) {
    return self._initialize(data);
  }).then(function(doc) {
    var props = self.schema.__raw__.properties;

    Object.keys(props).forEach(function(key) {
      var prop = props[key];

      if(prop.hasOwnProperty('default')) {
        doc[key] = utilities.clone(prop.default);
      }
    });
    return Promise.resolve(doc);
  }).then(function(doc) {
    return self.callHook('didCreate', doc).then(function() {
      return Promise.resolve(doc);
    });
  });
};

Model.prototype.get = function(key, cb) {
  var self = this;

  var args = {
    key: key
  };

  function getter(fn) {
    return new Promise(function(resolve, reject) {
      return self.db.get(self, args.key, function(err, data) {
        if(err) {
          return reject(err);
        }

        if(data) {
          return self._initialize(data).then(function(doc) {
            args.document = doc;
            return resolve();
          });
        } else {
          return resolve();
        }
      });
    }).nodeify(fn);
  }

  return this.performHookCycle('Get', args, getter).then(function() {
    return Promise.resolve(args.document);
  }).nodeify(cb);
};

Model.prototype.getFromImmediateData = function(data, cb) {
  var self = this;

  var args = {
    key: data[self.schema.primaryKey]
  };

  function getter(fn) {
    return self._initialize(data).then(function(doc) {
      args.document = doc;
      return Promise.resolve();
    }).nodeify(fn);
  }

  return this.performHookCycle('Get', args, getter).then(function() {
    return Promise.resolve(args.document);
  }).nodeify(cb);
};

Model.prototype.getOrCreate = function(key, cb) {
  var self = this;
  return this.get(key)
          .then(function(doc) {
            if(doc) {
              return Promise.resolve([doc, false]);
            } else {
              return self.create().then(function(doc) {
                doc.primaryKey = key;

                return Promise.resolve([doc, true]);
              });
            }
          }).nodeify(cb, { spread: true });
};

Model.prototype.find = function(spec, cb) {
  var self = this;

  var args = {
    spec: spec
  };

  function iterator(fn) {
    return new Promise(function(resolve, reject) {
      return self.db.find(self, args.spec, function(err, docs) {
        if(err) {
          return reject(err);
        } else {
          var arr = docs.map(function(doc) {
            return self._initialize(doc);
          });

          return Promise.all(arr).then(function(docs) {
            args.documents = docs;
            return resolve();
          });
        }
      });
    }).nodeify(fn);
  }

  return this.performHookCycle('Find', args, iterator).then(function() {
    return Promise.resolve(args.documents);
  }).nodeify(cb);
};

Model.prototype.findLimit = function(spec, start, limit, cb) {
  var self = this;

  var args = {
    spec: spec
  };

  function iterator(fn) {
    return new Promise(function(resolve, reject) {
      return self.db.findLimit(self, args.spec, start, limit, function(err, result) {
        if(err) {
          return reject(err);
        }

        args.count = result.count;

        var arr = result.docs.map(function(doc) {
          return self._initialize(doc);
        });

        return Promise.all(arr).then(function(docs) {
          args.documents = docs;
          return resolve();
        });
      });
    }).nodeify(fn);
  }

  return this.performHookCycle('Find', args, iterator).then(function() {
    return Promise.resolve({
      count: args.count,
      start: start,
      limit: limit,
      docs: args.documents
    });
  }).nodeify(cb);
};

Model.prototype.count = function(spec, done) {
  var args = {
    spec: spec
  };

  var self = this;

  function iterator(fn) {
    return new Promise(function(resolve, reject) {
      return self.db.count(self, args.spec, function(err, count) {
        if(err) {
          return reject(err);
        }

        args.count = count;
        return resolve();
      });
    }).nodeify(fn);
  }

  return this.performHookCycle('Count', args, iterator).then(function() {
    return Promise.resolve(args.count);
  }).nodeify(done);
};

Model.prototype.findOne = function (spec, done) {
  var self = this;

  var args = {
    spec: spec
  };

  function iterator(fn) {
    return new Promise(function(resolve, reject) {
      return self.db.findOne(self, args.spec, function(err, doc) {
        if(err) {
          return reject(err);
        }

        return self._initialize(doc).then(function(doc) {
          args.document = doc;
          resolve();
        }).catch(function(err) {
          reject(err);
        });
      });
    }).nodeify(fn);
  }

  return this.performHookCycle('FindOne', args, iterator).then(function() {
    return Promise.resolve(args.document);
  }).nodeify(done);
};

Model.prototype._update = function(doc, payload, done) {
  var self = this;

  var args = {
    doc: doc,
    payload: payload
  };

  function updator(fn) {
    return doc._update(payload).nodeify(fn);
  }

  return this.performHookCycle('Update', args, updator).nodeify(done);
};

Model.prototype._save = function(doc, done) {
  var self = this;

  var args = {
    doc: doc
  };

  function savor(fn) {
    if(args.doc.primaryKey) {
      var changes = objectDiff.diff(doc.__originalData__, args.payload);
      if(changes.changed === 'equal') {
        return process.nextTick(fn);
      }

      var diff = {};
      var set = {};
      var unset = {};

      Object.keys(changes.value).forEach(function(k) {
        var v = args.payload[k];
        if(changes.value[k].changed !== 'equal') {
          diff[k] = v;

          if(v === undefined) {
            unset[k] = '';
          } else {
            set[k] = v;
          }
        }
      });

      return new Promise(function(resolve, reject) {
        return self.db.put(args.doc, set, unset, function(err) {
          if(err) {
            return reject(err);
          }
          return resolve();
        });
      }).nodeify(fn);
    } else {
      return new Promise(function(resolve, reject) {
        return self.db.post(args.doc, args.payload, function(err) {
          if(err) {
            return reject(err);
          }

          return resolve();
        });
      }).nodeify(fn);
    }
  }

  return this.schema.validateDocument(args.doc).then(function() {
    args.payload = args.doc.toRawJSON ? args.doc.toRawJSON() : args .doc;

    return self.performHookCycle('Save', args, savor);
  });
};

Model.prototype._delete = function(doc) {
  if (!doc.primaryKey) {
    return Promise.reject(new OsmosError('This document does not have a primary key'));
  }

  var self = this;

  var args = {
    doc: doc
  };

  function deletor(fn) {
    var spec = {};

    spec[args.doc.model.schema.primaryKey] = args.doc.primaryKey;

    // @todo: need to change to promsies
    return self.db.del(self, spec, function(err) {
      fn(err);
    });
  }

  return this.performHookCycle('Delete', args, deletor);
};

Object.defineProperty(
  Model.prototype,
  'updateableProperties',
  {
    enumerable: true,
    get: function getUpdateablePropertiesOfModel() {
      return this._updateableProperties;
    },

    set: function setUpdateablePropertiesOfModel(value) {
      this._updateableProperties = value;

      if (value.forEach) {
        this.updateablePropertiesHash = {};

        value.forEach(function(prop) {
          this.updateablePropertiesHash[prop] = 1;
        }, this);
      } else {
        this.updateablePropertiesHash = value;
      }
    }
  }
);

module.exports = Model;
