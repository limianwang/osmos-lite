var osmos = require('../../lib');
var util = require('util');

var HookEmitter = function HookEmitter() {
    osmos.Hookable.apply(this);
    
    this.registerHook('leftHook');
    this.registerHook('rightHook');
};

util.inherits(HookEmitter, osmos.Hookable);

HookEmitter.prototype.callLeftHook = function callLeftHook(callback) {
    this.callHook('leftHook', {}, callback);
}

HookEmitter.prototype.callInvalidHook = function callInvalidHook(callback) {
    this.callHook('invalidHook', {}, callback);
}

module.exports = HookEmitter;