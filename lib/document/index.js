'use strict';

var async = require('async');
var util = require('util');

if (global.Proxy) {
  require('harmony-reflect');
  var proxy = require('./proxy');
}

var Document = function OsmosDataStoreDocument(model, data) {
  this.model = model;
  
  this.__originalData__ = {};

  this.schema = model.schema.schema;

  var rawKey;
  var source = model.schema.documentProperties;
  for (var key in source) {
    rawKey = this.constructor.virtualProperties[key] || key;

    if (data.hasOwnProperty(key)) {
      this[rawKey] = data[key];
      this.__originalData__[key] = data[key];
    } else {
      this[rawKey] = undefined;
      this.__originalData__[key] = undefined;
    }
  }

  source = this.constructor.virtualPropertyValues;
  for (key in source) {
    this[key] = source[key];
  }

  if (Document.debug) {
    if (!proxy) throw new Error('Debug mode requires that node be started with the --harmony switch');
    return new Proxy(this, proxy);
  } else {
    Object.seal(this);
  }
};

Document.debug = true;

Document.generateClass = function generateDocumentClass (documentClass, instanceProperties, instanceMethods, modelTransformers, schemaTransformers) {
  var result = function OsmosDataStoreDocument() {
    return documentClass.apply(this, arguments);
  };

  util.inherits(result, documentClass);

  var key, prop;

  result.virtualPropertyValues = {};

  for (key in instanceProperties) {
    prop = instanceProperties[key];

    if (prop.set || prop.get) Object.defineProperty(result.prototype, key, instanceProperties[key]); else result.virtualPropertyValues[key] = prop;
  }

  for (key in instanceMethods) {
    result.prototype[key] = instanceMethods[key];
  }

  function defineTransformers(source) {
    for (key in source) {
      result.virtualProperties[key] = '_' + key;
      
      Object.defineProperty(
        result.prototype, 
        key,
        {
          get: function() {
            return source[key].get ? source[key].get(this['_' + key]) : this['_' + key];
          },

          set: function(value) {
            this['_' + key] = source[key].set ? source[key].set(value) : value;
          }
        }
      );
    }
  }

  result.virtualProperties = {};
  defineTransformers(modelTransformers);
  defineTransformers(schemaTransformers);

  return result;
}

Object.defineProperty(
  Document.prototype,
  'primaryKey',
  {
    get: function() {
      return this[this.model.schema.primaryKey];
    },
    set: function(value) {
      this[this.model.schema.primaryKey] = value;
    }
  }
);

Object.defineProperty(
  Document.prototype,
  '__raw__',
  {
    get: function() {
      var result = this.toRawJSON();

      Object.freeze(result);

      return result;
    }
  }
);

Document.prototype.update = function(payload, cb) {
  if (this.model) return this.model._update(this, payload, cb);
  
  this._update(payload, cb);
};

Document.prototype._update = function(payload, cb) {
  var updateableProperties;
  
  if ('updateableProperties' in this) {
    updateableProperties = this.updateableProperties;
  }
  
  if (!updateableProperties && this.model) updateableProperties = this.model.updateablePropertiesHash;
  
  if (!updateableProperties) throw new Error('Update called on a document whose model has no updateable properties. See the docs for updateableProperties for more information.');
  if (updateableProperties.constructor.name != 'Object') return cb(new Error('Invalid data payload.', 400));
  
  var self = this;
  
  async.each(
    Object.keys(updateableProperties),
    
    function(key, cb) {
      if (payload.hasOwnProperty(key)) {
        self[key] = payload[key];
      }
      
      cb(null);
    },
    
    cb
  );
};

Document.prototype.save = function(cb) {
  var self = this;
  
  this.model._save(this, function(err) {
    if (!err) self.__originalData__ = self.toRawJSON();
    
    if (cb) cb(err, self);
  });
};

Document.prototype.del = function deleteDocument(cb) {
  this.model._delete(this, cb);
};

Document.prototype.clear = function clearDocument(discardPrimaryKey) {
  var pk = (discardPrimaryKey) ? undefined : this.primaryKey;

  for (var key in this.model.schema.documentProperties) {
    key = this.constructor.virtualProperties[key] || key;

    this[key] = undefined;
    this.__originalData__[key] = undefined;
  }

  this.__originalData__[this.model.schema.primaryKey] = this.primaryKey = pk;
};

Document.prototype.toJSON = function() {
  throw new Error('Osmos documents stubbornly refuse to provide a JSON representation. Provide one yourself and assign it to your model\'s `instanceMethods` instead.');
};

Document.prototype.toRawJSON = function() {
  var result = {};
  var readKey;

  for (var key in this.model.schema.documentProperties) {
    readKey = this.constructor.virtualProperties[key] || key;

    if (this[readKey] !== undefined) result[key] = this[readKey];
  }

  return result;
};

module.exports = Document;
