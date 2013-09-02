var tv = require('tv4').tv4;
var util = require('util');
var async = require('async');
var request = require('request');

var Error = require('./error');
var Hookable = require('./hookable');

var schemaValidator = tv.freshApi();
var metaSchema = require('./meta-schema.json');

schemaValidator.addSchema('http://json-schema.org/draft-04/schema', metaSchema);

var Schema = function OsmosSchema(uri, schema) {
  Hookable.call(this);
  
  Schema.validateSchema(schema);
  
  this.validator = tv.freshApi();
  this.validator.addSchema(uri, schema);
  this.schema = schema;
  
  this.loadSchemas();
}

util.inherits(Schema, Hookable);

Schema.schemas = {};

Schema.validateSchema = function validateSchema(schema) {
  var result = schemaValidator.validateMultiple(schema, metaSchema);
  
  if (result.errors.length) throw new Error('Failed to validate schema.', errors);
}

Schema.registerSchema = function registerSchema(uri, schema) {
  Schema.validateSchema(schema);
  
  Schema.schemas[uri] = uri;
}

Schema.prototype.hooks = [
  'willValidate',
  'didValidate'
];

Schema.prototype.loadSchemas = function () {
  var self = this;
  
  async.each(
    self.validator.getMissingUris(),
    
    function iterator(uri, cb) {
      if (Schema.schemas[uri]) {
        self.validator.addSchema(uri, Schema.schemas[uri]);
        cb();
      } else {
        request.get(uri, function(err, res) {
          if (err) return cb(err);
          
          var schema = JSON.parse(res.body);
          
          if (!schema) return cb(new Error('Cannot load schema at ' + uri));
          
          Schema.registerSchema(uri, schema);
          
          cb();
        });
      }
    },
    
    function finalCallback(err) {
      if (err) throw err;
      
      if (self.validator.getMissingUris().length) {
        return self.loadSchemas.call(self);
      }
      
      self.loaded = true;
      self.emit('loaded');
    }
  );
};

Schema.prototype.validateDocument = function(doc, cb) {
  var self = this;
  
  this.performHookCycle(
    'Validate',
    
    arguments,
    
    function validateSchema(cb) {
      var result = self.validator.validateMultiple(doc, self.schema);
      var err;
      
      if (result.errors.length) err = new Error('Validation failed.', 400, result.errors);
      
      return cb(err);
    },

    cb
  );
};

module.exports = Schema;