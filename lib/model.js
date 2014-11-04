'use strict';

var deepmerge = require('deepmerge');
var util = require('util');
var async = require('async');

var OsmosError = require('./util/error');
var Hookable = require('./util/hookable');
var Document = require('./document/');
var drivers = require('./drivers');

var Model = function Model(name, schema, bucket, db, documentClass) {
  this.schema = schema;
  this.bucket = bucket;
  this.db = typeof db == 'string' ? drivers.instance(db) : db;
  this.name = name;

  this.documentClass = null;
  this.documentClassConstructor = documentClass || Document;
  this.hasInitializedDocumentClass = false;

  this.instanceMethods = {};
  this.instanceProperties = {};
  this.transformers = {};

  if (!this.schema.primaryKey) throw new OsmosError('Schema is missing a primary key');

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

Model.prototype._initialize = function(data, cb) {
  if (!this.documentClass) this.generateDocumentClass();

  var args = {
    data: data,
    documentClass: this.documentClass
  };

  var self = this;

  async.series(
    [
      function(cb) {
        self.callHook('willInitialize', args, cb);
      },

      function(cb) {
        args.document = new args.documentClass(self, args.data);
        cb(null);
      },

      function(cb) {
        self.callHook('didInitialize', args, cb);
      }
    ],

    function(err) {
      cb(err, args.document);
    }
  );
};

Model.prototype.create = function(cb) {
  var self = this;

  async.waterfall(
    [
      function(cb) {
        self.db.create(self, cb);
      },

      function(data, cb) {
        self._initialize(data, function(err, doc) {
          if (err) return cb(err);

          var props = self.schema.__raw__.properties;

          Object.keys(props).forEach(function(key) {
            var prop = props[key];

            if(prop.hasOwnProperty('default')) {
              if(typeof prop.default === 'object') {
                doc[key] = deepmerge({}, prop.default);
              } else {
                doc[key] = prop.default;
              }
            }

          });

          self.callHook('didCreate', doc, function(err) {
            cb(err, doc);
          });
        });
      }
    ],

    cb
  );
};

Model.prototype.get = function(key, cb) {
  var self = this;

  var args = {
    key: key,
    stop: false
  };

  this.performHookCycle(
    'Get',

    args,

    function(cb) {
      if (args.stop) return cb(null);

      self.db.get(self, args.key, function(err, data) {
        if (err) return cb(err);
        if (data) {
          return self._initialize(data, function(err, doc) {
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
    key: data[self.schema.primaryKey],
    stop: false
  };

  this.performHookCycle(
    'Get',

    args,

    function(cb) {
      if (args.stop) return cb(null);

      self._initialize(data, function(err, doc) {
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

    self.create(function(err, doc) {
      doc.primaryKey = key;

      cb(null, doc, true);
    });
  });
};

Model.prototype.find = function(spec, cb) {
  var self = this;

  var args = {
    spec: spec,
    stop: false
  };

  this.performHookCycle(
    'Find',

    args,

    function(cb) {
      if (args.stop) return cb(null);

      self.db.find(self, args.spec, function(err, docs) {
        if (docs) {
          async.map(
            docs,

            function(doc, cb) {
              self._initialize(doc, cb);
            },

            function(err, docs) {
              args.documents = docs;
              cb(err);
            }
          );

          return;
        }

        cb(err);
      });
    },

    function(err) {
      return cb(err, args.documents);
    }
  );
};

Model.prototype.findLimit = function(spec, start, limit, cb) {
  var self = this;

  var args = {
    spec: spec,
    stop: false
  };

  this.performHookCycle(
    'Find',

    args,

    function(cb) {
      if (args.stop) return cb(null);

      self.db.findLimit(self, args.spec, start, limit, function(err, result) {
        args.count = result.count;

        if (result.docs) {
          async.map(
            result.docs,

            function(doc, cb) {
              self._initialize(doc, cb);
            },

            function(err, docs) {
              args.documents = docs;
              cb(err);
            }
          );

          return;
        }

        cb(err);
      });
    },

    function(err) {
      return cb(
        err,
        {
          count: args.count,
          start: start,
          limit: limit,
          docs : args.documents
        }
      );
    }
  );
};

Model.prototype.count = function(spec, done) {
  var args = {
    spec: spec,
    stop: false
  };

  var self = this;

  this.performHookCycle(
    'Count',
    args,
    function(next) {
      if(args.stop) {
        next(null);
      } else {
        self.db.count(self, args.spec, function(err, count) {
          args.count = count;
          next(null);
        });
      }
    },
    function(err) {
      done(err, args.count);
    }
  );
};

Model.prototype.findOne = function (spec, cb) {
  var self = this;

  var args = {
    spec: spec,
    stop: false
  };

  this.performHookCycle(
    'FindOne',

    args,

    function(cb) {
      if (args.stop) return cb(null);

      self.db.findOne(self, args.spec, function(err, data) {
        if (data) {
          self._initialize(data, function(err, doc) {
            args.document = doc;
            cb(err);
          });

          return;
        }

        cb(err);
      });
    },

    function(err) {
      return cb(err, args.document);
    }
  );
};

Model.prototype._update = function(doc, payload, cb) {
  var self = this;

  var args = {
    doc: doc,
    payload: payload,
    stop: false
  };

  self.performHookCycle(
    'Update',

    args,

    function(cb) {
      if (args.stop) return cb(null);

      doc._update(payload, cb);
    },

    cb
  );
};

Model.prototype._save = function(doc, cb) {
  var self = this;

  var args = {
    doc: doc,
    stop: false
  };

  async.series(
    [
      function(cb) {
        self.schema.validateDocument(args.doc, function(err) {
          if (err) return cb(err);

          args.payload = args.doc.toRawJSON ? args.doc.toRawJSON() : args.doc;
          cb(null);
        });
      },

      function(cb) {
        self.performHookCycle(
          'Save',

          args,

          function(cb) {
            if (args.stop) return cb(null);

            if (args.doc.primaryKey) {
              self.db.put(args.doc, args.payload, cb);
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

Model.prototype._delete = function(doc, cb) {
  if (!doc.primaryKey) throw new OsmosError('This document does not have a primary key');

  var self = this;

  var args = {
    doc: doc,
    stop: false
  };

  this.performHookCycle(
    'Delete',

    args,

    function(cb) {
      if (args.stop) return cb(null);

      var spec = {};

      spec[args.doc.model.schema.primaryKey] = args.doc.primaryKey;

      self.db.del(self, spec, cb);
    },

    cb
  );
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
