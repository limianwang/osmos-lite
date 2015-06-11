'use strict';

var Promise = require('native-or-bluebird');
var util = require('util');

var EventEmitter = require('events').EventEmitter;

var Hookable = function Hookable() {
  EventEmitter.call(this);

  if(!this.hooks) {
    throw new Error('No hooks are defined in this object.');
  }

  this.hookCallbacks = {};

  this.hookMap = {};

  this.hooks.forEach(function(hook) {
    this.hookMap[hook] = 1;
  }, this);
};

util.inherits(Hookable, EventEmitter);

Hookable.prototype.callHook = function callHook(hook, args, done) {
  if(!this.hookMap[hook]) {
    throw new Error('The hook `' + hook + '` is not defined.');
  }

  if(!(this.hookCallbacks[hook] && this.hookCallbacks[hook].length)) {
    return Promise.resolve(null).nodeify(done);
  }

  var self = this;

  function iterator(fn) {
    var self = this;
    return new Promise(function(resolve, reject) {
      return fn.call(self, args, function() {
        var args = Array.prototype.slice.call(arguments);
        var err = args.shift();

        if(err) {
          return reject(err);
        }

        return resolve(args);
      });
    });
  }

  var arr = self.hookCallbacks[hook].map(function(fn) {
    return iterator.call(self, fn);
  });

  return Promise.all(arr).nodeify(done, { spread: true });
};

Hookable.prototype.performHookCycle = function performHookCycle(hook, args, fn, done) {
  var self = this;

  return this.callHook('will' + hook, args).then(function() {
    return fn();
  }).then(function() {
    return self.callHook('did' + hook, args);
  });
};

Hookable.prototype.hook = function hookF(hook, fn) {
  if(!this.hookMap[hook]) {
    throw new Error('The hook `' + hook + '` is not defined.');
  }

  if(!this.hookCallbacks[hook]) {
    this.hookCallbacks[hook] = [];
  }

  this.hookCallbacks[hook].push(fn);

  return;
};

Hookable.prototype.unhook = function unhook(hook, fn) {
  if(!this.hookMap[hook]) {
    throw new Error('The hook `' + hook + '` is not defined.');
  }

  var index = this.hookCallbacks[hook]
                ? this.hookCallbacks[hook].indexOf(fn)
                : -1;

  if(index != -1) {
    throw new Error('The callback `' + callback + '` is not registered.');
  }

  this.hookCallbacks[hook].splice(index, 1);

  return;
};

module.exports = Hookable;
