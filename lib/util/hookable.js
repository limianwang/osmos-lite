'use strict';

var Promise = require('native-or-bluebird');
var util = require('util');
var async = require('async');

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
  return new Promise(function(resolve, reject) {
    function iterator(fn, next) {
      fn.call(this, args, next);
    }

    async.each(
      self.hookCallbacks[hook],
      iterator.bind(self),
      function(err) {
        if(err) {
          reject(err);
        } else {
          resolve();
        }
      }
    )
  }).nodeify(done);
};

Hookable.prototype.performHookCycle = function performHookCycle(hook, args, fn, done) {
  var self = this;

  return new Promise(function(resolve, reject) {
    async.series([
      function willHook(next) {
        return self.callHook('will' + hook, args, next);
      },
      function iterator(next) {
        // @fix me: This will need to fully be replaced by promises
        return fn.then ? fn.nodeify(next) : fn(next)
      },
      function didHook(next) {
        return self.callHook('did' + hook, args, next);
      },
    ], function(err, results) {
      if(err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  }).nodeify(done);
};

Hookable.prototype.hook = function hookF(hook, fn) {
  if(!this.hookMap[hook]) {
    throw new Error('The hook `' + hook + '` is not defined.');
  }

  if(!this.hookCallbacks[hook]) {
    this.hookCallbacks[hook] = [];
  }

  this.hookCallbacks[hook].push(fn);
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
};

module.exports = Hookable;
