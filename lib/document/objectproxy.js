var objectProxy = {
  getOwnPropertyNames: function getPropertiesOfProxiedObject(target) {
    return Object.keys(target.schema.properties);
  },
  
  defineProperty : function definePropertyOfProxiedObject(target, name, desc) {
    throw new Error('You cannot add properties to a document directly.');
  },
    
  deleteProperty : function deletePropertiesOfProxiedObject(target, name) {
    throw new Error('You cannot delete properties from a document.');
  },
  
  has: function propertyInProxiedObject(target, name) {
    return (name in target.schema.properties);
  },
  
  hasOwn: function ownPropetyInProxiedObject(target, name) {
    return (name in target.schema.properties);
  },
  
  get: function getPropertyOfProxiedObject(target, name, receiver) {
    return target.get(name);
  },
  
  set: function setPropertyOfProxiedObject(target, name, value, receiver) {
    target.set(name, value);
  },
  
  enumerate: function enumerateProxiedObjectProperties(target) {
    var keys = Object.keys(target.schema.properties);
    var index = 0;
   
    return {
      next : function next() {
        if (index === keys.length) {
         throw StopIteration;
        }

        return keys[index++];
      }
    }
  },

  keys: function getKeysOfProxiedObject(target) {
    return Object.keys(target.schema.properties);
  }
  
}

module.exports = objectProxy;