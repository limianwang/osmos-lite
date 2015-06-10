'use strict';

var Promise = require('native-or-bluebird');
var tv = require('tv4').tv4;
var util = require('util');
var request = require('request');

var OsmosError = require('../util/error');
var Hookable = require('../util/hookable');
var formats = require('./formats');

var schemaValidator = tv.freshApi();
var metaSchemas = require('./meta-schemas');

Object.keys(metaSchemas).forEach(function(uri) {
  schemaValidator.addSchema(uri, metaSchemas[uri]);
});

var Schema = function OsmosSchema(uri, schema) {
  Hookable.call(this);

  this.schemaUri = uri;
  this.__raw__ = schema;

  this.primaryKey = null;

  this.transformers = [];

  this.documentProperties = {};

  this.loadSchemas();
};

util.inherits(Schema, Hookable);

Schema.schemas = {};
Schema.formats = {};

Schema.validateSchema = function validateSchema(schema) {
  if (!schema)
    throw new OsmosError('Empty or non-existent schema passed to Osmos.Schema.validateSchema()');

  if (!schema.$schema)
    schema.$schema = 'http://json-schema.org/draft-04/schema#';

  var result = schemaValidator.validateMultiple(schema, { $ref : schema.$schema });

  if (result.missing.length)
    throw new OsmosError('Invalid or unknown schema', result.missing);

  if (result.errors.length)
    throw new OsmosError('Failed to validate schema.', result.errors);
};

Schema.registerSchema = function registerSchema(uri, schema) {
  Schema.validateSchema(schema);

  Schema.schemas[uri] = schema;
};

Schema.registerFormat = function registerFormat(format, processor) {
  Schema.formats[format] = processor;
};

Schema.prototype.hooks = [
  'willValidate',
  'didValidate'
];

Schema.prototype.resolveProperties = function(schema) {
  var self = this;

  if (schema.properties) {
    Object.keys(schema.properties).forEach(function(key) {
      self.documentProperties[key] = 1;
    });
  }

  function resolveReferences(container) {
    if (!container) return;

    container.forEach(function(property) {
      if (typeof property === 'object') {
        if (property.$ref) {
          var localSchema = self.validator.getSchema(property.$ref);

          if (localSchema) {
            self.resolveProperties(localSchema);
          }
        }
      } else {
        self.documentProperties[property] = 1;
      }
    });
  }

  resolveReferences(schema.anyOf);
  resolveReferences(schema.allOf);
  resolveReferences(schema.oneOf);
};

Schema.prototype.loadSchemas = function () {
  Schema.validateSchema(this.__raw__);

  var self = this;

  this.validator = tv.freshApi();
  this.validator.addSchema(this.schemaUri, this.__raw__);

  Object.keys(formats).forEach(function(key) {
    self.validator.addFormat(key, formats[key]);
  });

  Object.keys(Schema.formats).forEach(function(key) {
    self.validator.addFormat(key, Schema.formats[key]);
  });

  function iterator(uri) {
    return new Promise(function(resolve, reject) {
      if(Schema.schemas[uri]) {
        self.validator.addSchema(uri, Schema.schemas[uri]);

        return resolve();
      }
      return request.get(uri, function(err, res) {
        if(err) {
          return reject(err);
        }
        var schema = JSON.parse(res.body);
        if(!schema) {
          return reject(new OsmosError('Cannot load schema at ' + uri));
        } else {
          Schema.registerSchema(uri, schema);
          return resolve();
        }
      });
    });
  }

  var arr = self.validator.getMissingUris().map(function(uri) {
    return iterator(uri);
  });

  Promise.all(arr).then(function() {
    if(self.validator.getMissingUris().length) {
      return self.loadSchemas.call(self);
    }

    self.resolveProperties(self.__raw__);

    self.emit('loaded');
  }).catch(function(err) {
    self.emit('error', err);
    return;
  });

  return;
};

Schema.prototype.validateDocument = function(doc, done) {
  var self = this;

  function validator(fn) {
    return new Promise(function(resolve, reject) {
      var payload = doc.toRawJSON ? doc.toRawJSON() : doc;
      var result = self.validator.validateMultiple(payload, self.__raw__);

      var err;

      if(result.errors.length)
        err = new OsmosError('Validation failed.', 400, result.errors);

      if(err) {
        return reject(err);
      } else {
        return resolve();
      }
    }).nodeify(fn);
  }

  return this.performHookCycle('Validate', doc, validator).nodeify(done);
};

Schema.prototype.toJSON = function() {
  return this.__raw__;
};

module.exports = Schema;
