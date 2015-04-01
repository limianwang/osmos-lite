'use strict';

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

Hookable.prototype.callHook = function callHook(hook, args, cb) {
  if(!this.hookMap[hook]) {
    throw new Error('The hook `' + hook + '` is not defined.');
  }

  if(!(this.hookCallbacks[hook] && this.hookCallbacks[hook].length)) {
    return process.nextTick(function() {
      cb(null);
    });
  }

  function iterator(f, cb) {
    /*jshint validthis:true */
    f.call(this, args, cb);
  }

  async.each(
    this.hookCallbacks[hook],

    iterator.bind(this),

    cb
  );
};

Hookable.prototype.performHookCycle = function performHookCycle(hook, args, operationCb, finalCb) {
  async.series(
    [
      function willHook(cb) {
        this.callHook(
          'will' + hook,
          args,
          cb
        );
      }.bind(this),

      operationCb,

      function didHook(cb) {
        this.callHook(
          'did' + hook,
          args,
          cb
        );
      }.bind(this),
    ],

    finalCb
  );
};

Hookable.prototype.hook = function hookF(hook, callback) {
  if(!this.hookMap[hook]) {
    throw new Error('The hook `' + hook + '` is not defined.');
  }

  if(!this.hookCallbacks[hook]) {
    this.hookCallbacks[hook] = [];
  }

  this.hookCallbacks[hook].push(callback);
};

Hookable.prototype.unhook = function unhook(hook, callback) {
  if(!this.hookMap[hook]) {
    throw new Error('The hook `' + hook + '` is not defined.');
  }

  var index = this.hookCallbacks[hook]
                ? this.hookCallbacks[hook].indexOf(callback)
                : -1;

  if(index != -1) {
    throw new Error('The callback `' + callback + '` is not registered.');
  }

  this.hookCallbacks[hook].splice(index, 1);
};

module.exports = Hookable;
