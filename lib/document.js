'use strict';

var _ = require('lodash');
var Promise = require('native-or-bluebird');
var util = require('util');
var helpers = require('node-helper-utilities');

var Document = function OsmosDataStoreDocument(model, data) {
  this.model = model;

  this.__originalData__ = {};

  this.schema = model.schema.__raw__;

  var rawKey;
  var source = model.schema.documentProperties;
  var clone = helpers.clone(data);
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

  _.each(source, function(value, key) {
    this[key] = value;
  }, this);

  Object.seal(this);
};

Document.generateClass = function generateDocumentClass(documentClass, instanceProperties, instanceMethods, modelTransformers, schemaTransformers) {
  var result = function OsmosDataStoreDocument() {
    return documentClass.apply(this, arguments);
  };

  util.inherits(result, documentClass);

  var key, prop;

  result.virtualPropertyValues = {};

  _.each(instanceProperties, function(prop, key) {
    if (prop.set || prop.get)
      Object.defineProperty(result.prototype, key, prop);
    else
      result.virtualPropertyValues[key] = prop;
  });

  _.each(instanceMethods, function(method, key) {
    result.prototype[key] = method;
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

  for (key in modelTransformers) {
    defineTransformer(key, modelTransformers[key]);
  }

  for (key in schemaTransformers) {
    defineTransformer(key, schemaTransformers[key]);
  }

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
  return this.model._update(this, payload).nodeify(cb);
};

Document.prototype._update = function(payload) {
  var updateableProperties = this.model.updateablePropertiesHash;

  if (!updateableProperties) {
    return Promise.reject(new Error('Update called on a document whose model has no updateable properties. See the docs for updateableProperties for more information.'));
  }

  if (updateableProperties.constructor.name != 'Object') {
    return Promise.reject(new Error('Invalid data payload.', 400));
  }

  _.each(payload, function(value, key) {
    if (updateableProperties[key]) {
      if (typeof value === 'undefined') {
        this[key] = undefined;
      } else {
        this[key] = value;
      }
    }
  }, this);

  return Promise.resolve();
};

Document.prototype.save = function(cb) {
  var self = this;

  return this.model
    ._save(this)
    .then(function() {
      self.__originalData__ = self.toRawJSON();

      return Promise.resolve(self);
    })
    .nodeify(cb);
};

Document.prototype.del = function deleteDocument(done) {
  return this.model._delete(this).nodeify(done);
};

Document.prototype.clear = function clearDocument(discardPrimaryKey) {
  var pk = (discardPrimaryKey) ? undefined : this.primaryKey;

  _.each(this.model.schema.documentProperties, function(value, key) {
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

  _.each(this.model.schema.documentProperties, function(value, key) {
    readKey = this.constructor.virtualProperties[key] || key;

    if(this[readKey] !== undefined) {
      result[key] = helpers.clone(this[readKey]);
    }
  }, this);

  return result;
};

module.exports = Document;
