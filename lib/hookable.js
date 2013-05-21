var assert = require('assert');
var async = require('async');
var Hookable = function Hookable() {
    this.callbacks = {};
};

Hookable.prototype.registerHook = function registerHook(hook) {
    this.callbacks[hook] = this.callbacks[hook] || []; 
}

Hookable.prototype.callHook = function callHook(hook, args, callback) {
    assert(this.callbacks[hook], 'The hook `' + hook + '` is not defined.');
    
    var _this = this;
    
    async.each(
        this.callbacks[hook],
        
        function iterator(f, callback) {
            try {
                f.apply(_this, args);
                callback();
            } catch(err) {
                callback(err);
            }
        },
        
        callback
    );
}

Hookable.prototype.hook = function hook(hook, callback) {
    assert(this.callbacks[hook], 'The hook `' + hook + '` is not defined.');
    
    this.callbacks[hook].push(callback);
}

Hookable.prototype.unhook = function unhook(hook, callback) {
    assert(this.callbacks[hook], 'The hook `' + hook + '` is not defined.');
    
    var index = this.callbacks[hook].indexOf(callback);

    assert(index !== -1, 'The callback `' + callback + '` is not registered.');
    
    this.callbacks[hook].splice(index, 1);
}

module.exports = Hookable;