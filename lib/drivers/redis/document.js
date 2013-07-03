var Document = require('../../document');
var documentProxy = require('../../document/proxy');

var Error = require('../../error');
var util = require('util');
var extend = require('node.extend');

var RedisDocument = function OsmosRedisDocument(model, data, schema) {
    Document.call(this, model, data.object, true);
    
    this.__key = data.key;
    this.__created = false;
    
    return Proxy(this, documentProxy);
};

util.inherits(RedisDocument, Document);

RedisDocument.prototype.readableProperties.__created = 1;
RedisDocument.prototype.writeableProperties.__created = 1;

RedisDocument.prototype.methods = extend({}, RedisDocument.prototype.methods);

RedisDocument.prototype.methods.delete = function osmosRedisDocumentDelete(callback) {
    if (!this.primaryKey) {
        throw new Error('The schema on which this document is based does not have a key.');
    }
    
    var hookPayload = {
        document : this,
        spec : this.primaryKey,
        errors : []
    };
    
    this.performHookCycle(
        'Delete',
        
        hookPayload,
        
        function osmosRedisDocumentDeleteDocumentOperationCallback(callback) {
            if (hookPayload.errors.length) {
                return callback(hookPayload.errors);
            }

            this.model.db.delete(this.model.bucket, hookPayload.spec, function(errors) {
                if (errors) {
                    hookPayload.errors = hookPayload.errors.concat(errors);
                }
                
                callback(errors);
            });
        }.bind(this),
        
        function() {
            callback(hookPayload.errors.length ? hookPayload.errors : null);
        }
        
    );
};

Object.defineProperty(
    RedisDocument.prototype,
    'primaryKey',
    {
        enumerable : true,
        configurable: true,
        
        get: function() {
            return this.__key;
        },
        
        set: function(value) {
            this.__key = value;
        }
    }
);

Object.defineProperty(
    RedisDocument.prototype,
    '_created',
    {
        enumerable : true,
        configurable: true,
        
        get: function() {
            return this.__created;
        },
        
        set: function(value) {
            this.__created = value;
        }
    }
);

RedisDocument.prototype.methods.hincrby = function osmosRedisDocumentIncrByInteger(fieldName, increment, callback) {
    if (this.__created) {
        throw new Error('hincrby can only be called on documents that have already been saved to the data store.');
    }
    
    if (!fieldName in this.data) {
        throw new Error('Invalid field name ' + fieldName);
    }
    
    this.model.db.hincrby(this.model.bucket, this.primaryKey, fieldName, increment, function(err, value) {
        if (!err) {
            this.data[fieldName] = value;
        }
        
        callback(err);
    }.bind(this));
};

module.exports = RedisDocument;
