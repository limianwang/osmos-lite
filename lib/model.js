'use strict';

var Promise = require('native-or-bluebird');
var util = require('util');
var utilities = require('node-helper-utilities');
var async = require('async');

var OsmosError = require('./util/error');
var objectDiff = require('./util/objectdiff');
var Hookable = require('./util/hookable');
var Document = require('./document/');
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

  return this.performHookCycle(
    'Get',

    args,

    function(cb) {
      self.db.get(self, args.key, function(err, data) {
        if (err) return cb(err);
        if (data) {
          return self._initialize(data).then(function(doc) {
            args.document = doc;
            cb(null);
          });
        }

        cb(null);
      });
    },

    function(err) {
      return cb(err, args.document);
    }
  );
};

Model.prototype.getFromImmediateData = function(data, cb) {
  var self = this;

  var args = {
    key: data[self.schema.primaryKey]
  };

  return this.performHookCycle(
    'Get',

    args,

    function(cb) {
      self._initialize(data).then(function(doc) {
        args.document = doc;
        cb(null);
      });
    },

    function(err) {
      return cb(err, args.document);
    }
  );
};

Model.prototype.getOrCreate = function(key, cb) {
  var self = this;

  this.get(key, function(err, doc) {
    if (err || doc) {
      cb(err, doc, false);
      return;
    }

    self.create().then(function(doc) {
      doc.primaryKey = key;

      cb(null, doc, true);
    });
  });
};

Model.prototype.find = function(spec, cb) {
  var self = this;

  var args = {
    spec: spec
  };

  function iterator(fn) {
    self.db.find(self, args.spec, function(err, docs) {
      if(err) {
        return fn(err);
      } else {
        var arr = docs.map(function(doc) {
          return self._initialize(doc);
        });

        Promise.all(arr).then(function(docs) {
          args.documents = docs;
          fn();
        }).catch(function(err) {
          fn(err);
        });
      }
    });
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
    self.db.findLimit(self, args.spec, start, limit, function(err, result) {
      if(err) {
        return fn(err);
      }

      args.count = result.count;

      var arr = result.docs.map(function(doc) {
        return self._initialize(doc);
      });

      Promise.all(arr).then(function(docs) {
        args.documents = docs;
        fn();
      }).catch(function(err) {
        fn(err);
      });
    });
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
    return self.db.count(self, args.spec, function(err, count) {
      if(err) {
        return fn(err);
      }

      args.count = count;
      fn();
      ;
    });
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
    return self.db.findOne(self, args.spec, function(err, doc) {
      if(err) {
        return fn(err);
      }

      return self._initialize(doc).then(function(doc) {
        args.document = doc;
        fn();
      }).catch(function(err) {
        fn(err);
      });
    });
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

  function iterator(fn) {
    doc._update(payload).then(function() {
      fn.apply(null, arguments);
    }).catch(function(err) {
      fn(err);
    });
  }

  return this.performHookCycle('Update', args, iterator).nodeify(done);
};

Model.prototype._save = function(doc, cb) {
  var self = this;

  var args = {
    doc: doc
  };

  async.series([
    function(cb) {
      self.schema.validateDocument(args.doc, function(err) {
        if (err) {
          return cb(err);
        }

        args.payload = args.doc.toRawJSON ? args.doc.toRawJSON() : args.doc;
        cb(null);
      });
    },

    function(cb) {
      self.performHookCycle(
        'Save',

        args,

        function(cb) {
          if (args.doc.primaryKey) {
            var changes = objectDiff.diff(doc.__originalData__, args.payload);

            if(changes.changed === 'equal') {
              // nothing to update
              return cb();
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

            self.db.put(args.doc, set, unset, cb);
          } else {
            self.db.post(args.doc, args.payload, cb);
          }
        },
        cb
      );
    }
  ],
  cb
  );
};

Model.prototype._delete = function(doc, done) {
  if (!doc.primaryKey) {
    return Promise.reject(new OsmosError('This document does not have a primary key')).nodeify(done);
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

  return this.performHookCycle('Delete', args, deletor).nodeify(done);
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
