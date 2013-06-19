var assert = require('assert');
var async = require('async');
var Hookable = function Hookable() {
    this.callbacks = {};
};

Hookable.prototype.registerHook = function registerHook(hook) {
    this.callbacks[hook] = this.callbacks[hook] || []; 
};

Hookable.prototype.getAllHooks = function getAllHooks() {
    return Object.keys(this.callbacks);
}

Hookable.prototype.callHook = function callHook(hook, args, callback) {
    assert(this.callbacks[hook], 'The hook `' + hook + '` is not defined.');
    
    function iterator(f, callback) {
        f.call(this, args, callback);
    }
    
    async.each(
        this.callbacks[hook],
        
        iterator.bind(this),
        
        callback
    );
};

Hookable.prototype.performHookCycle = function performHookCycle(hook, args, operationCallback, finalCallback) {
    async.series(
        [
            function willHook(callback) {
                this.callHook(
                    'will' + hook,
                    args,
                    callback
                );
            }.bind(this),
        
            operationCallback,
        
            function didHook(callback) {
                this.callHook(
                    'did' + hook,
                    args,
                    callback
                );
            }.bind(this),
        ],
        
        finalCallback
    );
}

Hookable.prototype.hook = function hook(hook, callback) {
    assert(this.callbacks[hook], 'The hook `' + hook + '` is not defined.');
    
    this.callbacks[hook].push(callback);
};

Hookable.prototype.unhook = function unhook(hook, callback) {
    assert(this.callbacks[hook], 'The hook `' + hook + '` is not defined.');
    
    var index = this.callbacks[hook].indexOf(callback);

    assert(index !== -1, 'The callback `' + callback + '` is not registered.');
    
    this.callbacks[hook].splice(index, 1);
};

module.exports = Hookable;