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
  'willSave',
  'didSave',
  'willDelete',
  'didDelete'
];

Model.prototype.instanceProperties = {};
Model.prototype.instanceMethods = {};

Model.prototype.transformers = {};

Model.prototype.create = function(cb) {
  var self = this;
  
  async.waterfall(
    [
      function(cb) {
        self.db.create(self.bucket, cb);
      },
    
      function(doc, cb) {
        self.callHook('didCreate', doc, function(err) {
          cb(err, new self.documentClass(self, doc));
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
      
      self.db.get(self.bucket, args.key, function(err, doc) {
        if (doc) args.doc = new self.documentClass(self, doc);
        
        cb(err);
      });
    },
    
    function(err) {
      return cb(err, args.doc);
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
        args.docs = [];
        
        if (docs) {
          docs.forEach(function(doc) {
            args.docs.push(new self.documentClass(self, doc));
          });
        }

        cb(err);
      });
    },
    
    function(err) {
      return cb(err, args.docs);
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
      
      self.db.findOne(self.bucket, args.spec, function(err, doc) {
        if (doc) args.doc = new self.documentClass(self, doc);

        cb(err);
      });
    },
    
    function(err) {
      return cb(err, args.doc);
    }
  );
};

Model.prototype._save = function(doc, cb) {
  var self = this;
  
  var args = {
    doc: doc,
    payload: doc.toJSON(),
    stop: false
  };
  
  async.series(
    [
      function(cb) {
        self.schema.validateDocument(args.payload, cb);
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
      
      self.db.delete(self.bucket, spec, cb);
    },

    cb
  );
};

module.exports = Model;