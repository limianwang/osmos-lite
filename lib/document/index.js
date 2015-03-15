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

  this.schema = model.schema.__raw__;

  var rawKey;
  var source = model.schema.documentProperties;
  var clone = cloneObject(data);
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
  for (key in source) {
    this[key] = source[key];
  }

  if (Document.debug) {
    if (!proxy) {
      throw new Error('Debug mode requires that node be started with the --harmony switch');
    }
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

    if (prop.set || prop.get)
      Object.defineProperty(result.prototype, key, instanceProperties[key]);
    else
      result.virtualPropertyValues[key] = prop;
  }

  for (key in instanceMethods) {
    result.prototype[key] = instanceMethods[key];
  }

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
  if(this.model) {
    this.model._update(this, payload, cb);
  } else {
    this._update(payload, cb);
  }
};

Document.prototype._update = function(payload, cb) {
  var updateableProperties;

  if ('updateableProperties' in this) {
    updateableProperties = this.updateableProperties;
  }

  if (!updateableProperties && this.model)
    updateableProperties = this.model.updateablePropertiesHash;

  if (!updateableProperties)
    throw new Error('Update called on a document whose model has no updateable properties. See the docs for updateableProperties for more information.');
  if (updateableProperties.constructor.name != 'Object')
    return cb(new Error('Invalid data payload.', 400));

  Object.keys(payload).forEach(function(key) {
    if(updateableProperties[key]) {
      if(typeof payload[key] === 'undefined') {
        this[key] = undefined;
      } else {
        this[key] = payload[key];
      }
    }
  }, this);

  process.nextTick(function() {
    cb();
  });
};

Document.prototype.save = function(cb) {
  var self = this;

  this.model._save(this, function(err) {
    if(err) {
      cb(err, self);
    } else {
      self.__originalData__ = self.toRawJSON();
      cb(null, self);
    }
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

Document.prototype.inspect = function() {
  return util.inspect(this.toRawJSON());
}

// Borrowed from http://stackoverflow.com/questions/728360/most-elegant-way-to-clone-a-javascript-object

function cloneObject(obj) {
  // Handle the 3 simple types, and null or undefined
  if (null == obj || "object" != typeof obj) return obj;

  // Handle Date
  if (obj instanceof Date) {
    var copy = new Date();
    copy.setTime(obj.getTime());
    return copy;
  }

  // Handle Array
  if (obj instanceof Array) {
    var copy = [];
    for (var i = 0, len = obj.length; i < len; i++) {
      copy[i] = cloneObject(obj[i]);
    }

    return copy;
  }

  // Handle Object
  if (obj instanceof Object) {
    var copy = {};

    for (var attr in obj) {
      if (obj.hasOwnProperty(attr)) copy[attr] = cloneObject(obj[attr]);
    }

    return copy;
  }

  return obj;
}

// End borrow

Document.prototype.toRawJSON = function() {
  var result = {};
  var readKey;

  for (var key in this.model.schema.documentProperties) {
    readKey = this.constructor.virtualProperties[key] || key;

    if(this[readKey] !== undefined) {
      result[key] = cloneObject(this[readKey]);
    }
  }

  return result;
};

module.exports = Document;
