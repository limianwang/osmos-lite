var util = require('util');

var objectProxy = require('./objectproxy');
var AbstractDocument = require('./document');

var Document = function OsmosDataStoreDocument(model, data) {
  this.model = model
  
  this.originalData = JSON.parse(JSON.stringify(data));
  this.instanceProperties = {};
  
  var result = AbstractDocument.call(this, data, model.schema.schema);
  
  return result;
};

util.inherits(Document, AbstractDocument);

Object.defineProperty(
  Document.prototype,
  '__originalData__',
  {
    get: function() {
      return this.originalData;
    }
  }
);

Object.defineProperty(
  Document.prototype,
  'primaryKey',
  {
    get: function() {
      return this.data[this.model.schema.primaryKey];
    },
    set: function(value) {
      this.set(this.model.schema.primaryKey, value);
    }
  }
);

Document.prototype.get = function getValueFromDocument(name) {
  if (name == 'constructor') return AbstractDocument;
  if (name == 'inspect') return this.inspect;
  
  if (name in this.model.instanceMethods) return this.model.instanceMethods[name].bind(Proxy(this, objectProxy));
  if (name in this.model.instanceProperties) return this.instanceProperties[name];
  
  return AbstractDocument.prototype.get.call(this, name)
};

Document.prototype.set = function setValueInDocument(name, value) {
  if (name in this.model.instanceProperties) {
    this.instanceProperties[name] = value;
    return;
  }

  AbstractDocument.prototype.set.call(this, name, value);
};

Document.prototype.save = function(cb) {
  var self = this;
  
  this.model._save(this, function(err) {
    if (!err) self.originalData = JSON.parse(JSON.stringify(self.data));
    
    cb(err);
  });
};

Document.prototype.del = function(cb) {
  this.model._delete(this, cb);
};

Document.prototype.toJSON = function() {
  throw new Error('Osmos documents stubbornly refuse to provide a JSON representation. Provide one yourself and assign it to your model\'s `instanceMethods` instead.');
};

Document.prototype.toRawJSON = function() {
  return JSON.parse(JSON.stringify(this.data));
};

module.exports = Document;
