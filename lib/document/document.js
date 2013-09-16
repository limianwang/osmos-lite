require('harmony-reflect');

var objectProxy = require('./objectproxy.js');

var Document = function OsmosDocument(data, schema) {
  this.schema = schema;
  this.data = data;
  
  return Proxy(this, objectProxy);
}

Document.specialGetProperties = {
  inspect: 1
};

Object.defineProperty(
  Document.prototype,
  '__raw__',
  {
    get: function() {
      return this.data;
    }
  }
);

Document.prototype.get = function (name) {
  if (name in Document.specialGetProperties || this.name !== undefined || name in this) return this[name];
  if (name in this.schema.properties) {
    var transformer = this.schema.properties[name].transformer;
    var value = this.data[name];

    if (transformer && transformer.get) {
      value = transformer.get(value);
    }
    
    return value;
  };
  
  throw new Error('The property ' + name + ' is not part of this document.');
};

Document.prototype.set = function (name, value) {
  if (this.name !== undefined || name in this) {
    this[name] = value;
    return;
  }
  
  if (name in this.schema.properties) {
    var transformer = this.schema.properties[name].transformer;
    
    if (transformer && transformer.set) {
      value = transformer.set(value);
    }
    
    switch(value.constructor.name) {
      case 'object':
        value = new Document(object, this.schema.properties[name]);
        break;
        
      case 'array':
        //TODO Array
        break;
    }

    this.data[name] = value;
    return;
  } 
  
  throw new Error('The property ' + name + ' is not part of this document.');
};

module.exports = Document;