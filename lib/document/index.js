var util = require('util');

var ObjectProxy = require('./objectproxy');

var Document = function OsmosDocument(model, data) {
  ObjectProxy.call(this, model, model.name, model.schema, data);
  
  this.instanceProperties = {};
  
  return Proxy(data, this);
}

util.inherits(Document, ObjectProxy);

Object.defineProperty(
  Document.prototype,
  '__raw__',
  {
    enumerable: false,
    configurable: false,
    get: function() {
      return this.toJSON();
    }
  }
);

Object.defineProperty(
  Document.prototype,
  'primaryKey',
  {
    enumerable: false,
    configurable: false,
    get: function() {
      return ObjectProxy.prototype.get.call(this, this.data, this.schema.primaryKey);
    },
    set: function(value) {
      ObjectProxy.prototype.set.call(this, this.data, this.schema.primaryKey, value, this);
    }
  }
);

Document.prototype.get = function getValueFromDocument(target, name) {
  if (name in this) {
    return this[name];
  }

  if (name in this.model.instanceMethods) return this.model.instanceMethods[name];
  
  if (name in this.model.instanceProperties) return this.instanceProperties[name];
  
  return ObjectProxy.prototype.get.call(this, target, name);
};

Document.prototype.set = function setValueInDocument(target, name, value, receiver) {
  if (name === 'primaryKey') {
    this.primaryKey = value;
    return;
  }
  
  if (name in this.model.instanceProperties) {
    this.instanceProperties[name] = value;
    return;
  }
  
  ObjectProxy.prototype.set.call(this, target, name, value, receiver);
};

Document.prototype.save = function(cb) {
  this.model._save(this, cb);
};

Document.prototype.del = function(cb) {
  this.model._delete(this, cb);
};

module.exports = Document;