'use strict';

var assert = require('assert');

var proxy = module.exports = {
  has: function propertyInProxiedObject(target, name) {
    return (name in target);
  },
  
  hasOwn: function ownPropetyInProxiedObject(target, name) {
    return (name in target);
  },
  
  get: function getPropertyOfProxiedObject(target, name) {
    assert(proxy.has(target, name), 'The property `' + name + '` is not part of this document.');
    return target[name];
  },
  
  set: function setPropertyOfProxiedObject(target, name, value) {
    assert(proxy.has(target, name), 'The property `' + name + '` is not part of this document.');
    target[name] = value;
  }
};