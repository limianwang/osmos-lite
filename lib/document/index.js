'use strict';

var Promise = require('native-or-bluebird');
var async = require('async');
var util = require('util');
var helperUtils = require('node-helper-utilities');

var Document = function OsmosDataStoreDocument(model, data) {
  this.model = model;

  this.__originalData__ = {};

  this.schema = model.schema.__raw__;

  var rawKey;
  var source = model.schema.documentProperties;
  var clone = helperUtils.clone(data);
  for (var key in source) {
    rawKey = this.constructor.virtualProperties[key] || key;

    if (clone.hasOwnProperty(key)) {
      this[rawKey] = data[key];
      this.__originalData__[key] = clone[key];
    } else {
      this[rawKey] = undefined;
      this.__originalData__[key] = undefined;
    }
  }

  source = this.constructor.virtualPropertyValues;

  Object.keys(source).forEach(function(key) {
    this[key] = source[key];
  }, this);

  Object.seal(this);
};

Document.generateClass = function generateDocumentClass (documentClass, instanceProperties, instanceMethods, modelTransformers, schemaTransformers) {
  var result = function OsmosDataStoreDocument() {
    return documentClass.apply(this, arguments);
  };

  util.inherits(result, documentClass);

  var key, prop;

  result.virtualPropertyValues = {};

  Object.keys(instanceProperties).forEach(function(key) {
    prop = instanceProperties[key];

    if (prop.set || prop.get)
      Object.defineProperty(result.prototype, key, instanceProperties[key]);
    else
      result.virtualPropertyValues[key] = prop;
  });

  Object.keys(instanceMethods).forEach(function(key) {
    result.prototype[key] = instanceMethods[key];
  });

  function defineTransformer(key, transformer) {
    result.virtualProperties[key] = '_' + key;

    Object.defineProperty(
      result.prototype,
      key,
      {
        get: function() {
          return transformer.get ? transformer.get(this['_' + key]) : this['_' + key];
        },

        set: function(value) {
          this['_' + key] = transformer.set ? transformer.set(value) : value;
        }
      }
    );
  }

  result.virtualProperties = {};

  for (key in modelTransformers)
    defineTransformer(key, modelTransformers[key]);
  for (key in schemaTransformers)
    defineTransformer(key, schemaTransformers[key]);

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
  var self = this;
  return new Promise(function(resolve, reject) {
    return self.model._update(self, payload, function(err) {
      if(err) {
        reject(err);
      } else {
        resolve();
      }
    });
  }).nodeify(cb);
};

Document.prototype._update = function(payload, cb) {
  var updateableProperties = this.model.updateablePropertiesHash;

  if (!updateableProperties) {
    return Promise.reject(new Error('Update called on a document whose model has no updateable properties. See the docs for updateableProperties for more information.')).nodeify(cb);
  }

  if (updateableProperties.constructor.name != 'Object') {
    return Promise.reject(new Error('Invalid data payload.', 400)).nodeify(cb);
  }

  Object.keys(payload).forEach(function(key) {
    if(updateableProperties[key]) {
      if(typeof payload[key] === 'undefined') {
        this[key] = undefined;
      } else {
        this[key] = payload[key];
      }
    }
  }, this);

  return Promise.resolve().nodeify(cb);
};

Document.prototype.save = function(cb) {
  var self = this;

  return new Promise(function(resolve, reject) {
    return self.model._save(self, function(err) {
      if(err) {
        reject(err);
      } else {
        self.__originalData__ = self.toRawJSON();
        resolve(self)
      }
    });
  }).nodeify(cb);
};

Document.prototype.del = function deleteDocument(done) {
  return this.model._delete(this).nodeify(done);
};

Document.prototype.clear = function clearDocument(discardPrimaryKey) {
  var pk = (discardPrimaryKey) ? undefined : this.primaryKey;

  Object.keys(this.model.schema.documentProperties).forEach(function(key) {
    key = this.constructor.virtualProperties[key] || key;

    this[key] = undefined;
    this.__originalData__[key] = undefined;
  }, this);

  this.__originalData__[this.model.schema.primaryKey] = this.primaryKey = pk;
};

Document.prototype.toJSON = function() {
  throw new Error('Osmos documents stubbornly refuse to provide a JSON representation. Provide one yourself and assign it to your model\'s `instanceMethods` instead.');
};

Document.prototype.inspect = function() {
  return util.inspect(this.toRawJSON());
};

Document.prototype.toRawJSON = function() {
  var result = {};
  var readKey;

  Object.keys(this.model.schema.documentProperties).forEach(function(key) {
    readKey = this.constructor.virtualProperties[key] || key;

    if(this[readKey] !== undefined) {
      result[key] = helperUtils.clone(this[readKey]);
    }
  }, this);

  return result;
};

module.exports = Document;
