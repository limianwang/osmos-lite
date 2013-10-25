var util = require('util');
var async = require('async');

var Error = require('./util/error');
var Hookable = require('./util/hookable');
var Document = require('./document/');
var drivers = require('./drivers');

var Model = function Model(name, schema, bucket, db, documentClass) {
  this.schema = schema;
  this.bucket = bucket;
  this.db = typeof db == 'string' ? drivers.instance(db) : db;
  this.name = name;
  this.documentClass = documentClass || Document;
  
  this.instanceMethods = {};
  this.instanceProperties = {};
  this.transformers = {};

  if (!this.schema.primaryKey) throw new Error('Schema is missing a primary key');  
  
  Hookable.call(this);
};

util.inherits(Model, Hookable);

Model.prototype.hooks = [
  'didCreate',
  'willFind',
  'didFind',
  'willFindOne',
  'didFindOne',
  'willGet',
  'didGet',
  'willInitialize',
  'didInitialize',
  'willSave',
  'didSave',
  'willDelete',
  'didDelete'
];

Model.prototype.instanceProperties = {};
Model.prototype.instanceMethods = {};

Model.prototype.transformers = {};

Model.prototype._initialize = function(data, cb) {
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
        cb();
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
        self.db.create(self.bucket, cb);
      },
    
      function(data, cb) {
        self._initialize(data, function(err, doc) {
          if (err) return cb(err);
          
          var props = self.schema.schema.properties;
          
          Object.keys(props).forEach(function(key) {
            var prop = props[key];
            
            if (prop.default) doc[key] = prop.default;
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
      if (args.stop) return cb();
      
      self.db.get(self.bucket, args.key, function(err, data) {
        if (err) return cb(err);
        if (data) return self._initialize(data, function(err, doc) {
          args.document = doc;
          cb();
        });
        
        cb();
      });
    },
    
    function(err) {
      return cb(err, args.document);
    }
  );
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
      if (args.stop) return cb();
      
      self.db.find(self.bucket, args.spec, function(err, docs) {
        args.documents = [];
        
        if (docs) {
          docs.every(function(data) {
            self._initialize(data, function(err, doc) {
              if (err) return cb(err);
              args.documents.push(doc);
            });
          });
        }

        cb(err);
      });
    },
    
    function(err) {
      return cb(err, args.documents);
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
      if (args.stop) return cb();
      
      self.db.findOne(self.bucket, args.spec, function(err, data) {
        if (data) return self._initialize(data, function(err, doc) {
          args.document = doc;
          cb(err);
        });

        cb(err);
      });
    },
    
    function(err) {
      return cb(err, args.document);
    }
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
          cb();
        });
      },
      
      function(cb) {
        self.performHookCycle(
          'Save',
    
          args,
    
          function(cb) {
            if (args.stop) return cb();
            
            if (args.doc.primaryKey) {
              self.db.put(self.bucket, args.doc, args.payload, cb);
            } else {
              self.db.post(self.bucket, args.doc, args.payload, cb);
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
  if (!doc.primaryKey) throw new Error('This document does not have a primary key');
  
  var self = this;
  
  var args = {
    doc: doc,
    stop: false
  };
  
  this.performHookCycle(
    'Delete',
    
    args,
    
    function(cb) {
      if (args.stop) return cb();
      
      var spec = {};
      
      spec[args.doc.model.schema.primaryKey] = args.doc.primaryKey;
      
      self.db.del(self.bucket, spec, cb);
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
