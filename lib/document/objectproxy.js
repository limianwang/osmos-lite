require('harmony-reflect');

var Error = require('../util/error');

var ObjectProxy = function OsmosObjectProxy(model, path, schema, data) {
  this.path = path;
  this.model = model;
  this.schema = schema;
  
  Object.keys(data).forEach(function(key) {
    var val = data[key];
    
    if (val && val.constructor.name == 'Object') {
      data[key] = new ObjectProxy(model, path + '.' + key, schema.properties[key], data);
    }
  });
  
  this.data = data;
  
  return Proxy(this, this);
};

ObjectProxy.prototype.getOwnPropertyNames = function getPropertyNameOfProxiedObject(target) {
  return Object.keys(schema.properties);
};

ObjectProxy.prototype.defineProperty = function defineNewPropertyInProxiedObject() {
  throw new Error('Properties cannot be defined on document instances of ' + this.path + '. Add them to the model\'s `instanceMethods` hash instead.');
};

ObjectProxy.prototype.deleteProperty = function deleteProxiedObjectProperty(target, name) {
  if (!name in schema.properties) throw new Error('The property ' + name + ' is not part of the schema for ' + this.path);
    
  delete target[name];
};

ObjectProxy.prototype.has = function propertyInProxiedObject(target, name) {
  if (!name in this.schema.schema.properties) throw new Error('The property ' + name + ' is not part of the schema for ' + this.path);

  return name in target;
};

ObjectProxy.prototype.hasOwn = function ownPropertyInProxiedObject(target, name) {
  if (!name in schema.properties) throw new Error('The property ' + name + ' is not part of the schema for ' + this.path);
  
  return Object.hasOwnProperty(name);
};

ObjectProxy.prototype.get = function getProxiedObjectProperty(target, name, receiver) {
  var transformer;
  
  if (name in this.schema.schema.properties) {
    transformer = this.model.transformers[this.path + '.' + name];
    
    if (transformer && transformer.get) {
      return transformer.get.call(Proxy(this.data, this), target[name]);
    }

    return target[name];
  } 
  
  throw new Error('The property ' + name + ' is not part of any definition of ' + this.path);
};

ObjectProxy.prototype.set = function setProxiedObjectProperty(target, name, value, receiver) {
  var transformer;
  
  if (name in this.schema.schema.properties) {
    transformer = this.model.transformers[this.path + '.' + name];
    
    if (transformer && transformer.set) {
      value = transformer.set.call(Proxy(this.data, this), value);
    }
    
    if (value && value.constructor.name == 'Object') {
      value = new ObjectProxy(this.model, this.path + '.' + name, this.schema.properties[name], value);
    }
    
    target[name] = value;
    return;
  }
  
  throw new Error('The property ' + name + ' is not part of any definition of ' + this.path);
};

ObjectProxy.prototype.enumerate = function enumerateProxiedObjectProperties(target) {
  var keys = Object.keys(this.schema.schema.properties);
  var index = 0;
   
  return {
    next : function next() {
      if (index === keys.length) {
       throw StopIteration;
      }

      return keys[index++];
    }
  }
};

ObjectProxy.prototype.keys = function getKeysOfProxiedObject(target) {
  return Object.keys(target);
};

ObjectProxy.prototype.toJSON = function convertProxiedObjectToJSON() {
  return this.data;
};

ObjectProxy.prototype.inspect = function inspectProxiedObject() {
  return JSON.stringify(this);
};

module.exports = ObjectProxy;
