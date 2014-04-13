'use strict';

var util = require('util');

var AbstractDocument = require('./document');

var Document = function OsmosDataStoreDocument(model, data) {
  this.model = model;
  
  this.__originalData__ = {};

  AbstractDocument.call(this, data, model.schema.schema, '');

  for (var key in this.schema.properties) {
    if (data.hasOwnProperty(key)) {
      this[key] = data[key];
      this.__originalData__[key] = data[key];
    } else {
      this[key] = undefined;
      this.__originalData__[key] = undefined;
    }
  }

  Object.seal(this);
};

util.inherits(Document, AbstractDocument);

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

  for (var key in self.schema.properties) delete this[key];

  this.primaryKey = pk;
};

Document.prototype.toJSON = function() {
  throw new Error('Osmos documents stubbornly refuse to provide a JSON representation. Provide one yourself and assign it to your model\'s `instanceMethods` instead.');
};

Document.prototype.toRawJSON = function() {
  var result = {};

  for (var key in this.schema.properties) {
    if (this[key] !== undefined) result[key] = this[key];
  }

  return result;
};

module.exports = Document;
