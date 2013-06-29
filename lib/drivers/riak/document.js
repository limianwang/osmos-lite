var Document = require('../../document');
var documentProxy = require('../../document/proxy');

var Error = require('../../error');
var util = require('util');
var extend = require('node.extend');

var RiakDocument = function OsmosRiakDocument(model, data, schema) {
    Document.call(this, model, data.object, true);
    
    this.meta = data.meta;
    
    return Proxy(this, documentProxy);
};

util.inherits(RiakDocument, Document);

RiakDocument.prototype.methods = extend({}, RiakDocument.prototype.methods);

RiakDocument.prototype.methods.save = function osmosRiakDocumentSave() {
    this.model.performAutoIndex(this);
    
    Document.prototype.methods.save.apply(this, arguments);
};

RiakDocument.prototype.methods.delete = function osmosRiakDocumentDelete(callback) {
    if (!this.primaryKey) {
        throw new Error('The schema on which this document is based does not have a key.');
    }
    
    var hookPayload = {
        document : this,
        spec : this.meta.key,
        errors : []
    };
    
    this.performHookCycle(
        'Delete',
        
        hookPayload,
        
        function osmosRiakDocumentDeleteDocumentOperationCallback(callback) {
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

RiakDocument.prototype.dynamicProperties.meta = {
    get : function get() {
        return this.meta;
    },
    
    set : function set(value) {
        throw new Error('The value of the meta element cannot be set. Write data into it instead.');
    }
};

Object.defineProperty(
    RiakDocument.prototype,
    'primaryKey',
    {
        enumerable : true,
        configurable: true,
        
        get: function() {
            return ('key' in this.meta) ? this.meta.key : undefined;
        },
        
        set: function(value) {
            this.meta.key = value;
        }
    }
);

module.exports = RiakDocument;