var expect = require('chai').expect;
var osmos = require('../lib');
var HookEmitter = require('./fixtures/hookemitter');

describe('The Pluggable object', function() {
    it('should support registering new hooks', function() {
        var emitter = new HookEmitter();
        var callback = function() { console.log(); };
        
        emitter.hook('leftHook', callback);
        
        expect(emitter.callbacks).to.include.keys('leftHook');
        expect(emitter.callbacks['leftHook']).to.include(callback);
    });
    
    it('should support unregistering existing hooks', function() {
        var emitter = new HookEmitter();
        var callback = function() { console.log(); };
        
        emitter.hook('leftHook', callback);
        
        expect(emitter.callbacks).to.include.keys('leftHook');
        expect(emitter.callbacks['leftHook']).to.include(callback);
        
        emitter.unhook('leftHook', callback);

        expect(emitter.callbacks).to.include.keys('leftHook');
        expect(emitter.callbacks['leftHook']).to.not.include(callback);
    });
    
    it('should refuse to emit invalid hooks', function() {
        var emitter = new HookEmitter();
        
        expect(emitter.callInvalidHook).to.throw(Error);
    });
    
    it('should properly emit valid hooks', function(done) {
        var emitter = new HookEmitter();
        
        var v1 = false, v2 = false;

        emitter.hook('leftHook', function(data, callback) {
            v1 = true;
            callback(null);
        });
        
        emitter.hook('leftHook', function(data, callback) {
            v2 = true;
            callback(null);
        });
        
        emitter.callLeftHook(function() {
            expect(v1).to.be.true;
            expect(v2).to.be.true;
            
            done();
        });     
    });
    
    it('should not allow a target to hook to a non-existing hook', function() {
        var emitter = new HookEmitter();
        
        function unhook() {
            emitter.hook('invalidHook', function() {});
        }
        
        expect(unhook).to.throw(Error);
    });
    
    it('should now allow a target to unhook to a hook to which it is not hooked.', function() {
        var emitter = new HookEmitter();

        function unhook() {
            emitter.unhook('leftHook', function() {});
        }
        
        expect(unhook).to.throw(Error);
    });
});