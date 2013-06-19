var documentProxy = require('./proxy');
var AbstractDocument = require('./abstractdocument');
var ArrayProxy = require('./array.js');
var Error = require('../error');

var util = require('util');

var Document = function OsmosDocument(model, data, schema) {
    AbstractDocument.call(this, model, data);
    
    return Proxy(this, documentProxy);
};

util.inherits(Document, AbstractDocument);

Document.prototype.readableProperties.primaryKey = 1;

Object.defineProperty(
    Document.prototype,
    'primaryKey',
    {
        enumerable : true,
        get: function() {
            if (this.parent) {
                throw new Error('Subdocuments cannot have primary keys.');
            }
        
            if (!this.schema.primaryKey) {
                throw new Error('The schema on which this document is based does not have a primary key.');
            }
        
            return this.data[this.schema.primaryKey];
        },
        
        set: function(value) {
            if (this.parent) {
                throw new Error('Subdocuments cannot have primary keys.');
            }
        
            if (!this.schema.primaryKey) {
                throw new Error('The schema on which this document is based does not have a primary key.');
            }
    
            this.setFieldValue(this.schema.primaryKey, value);
        }
    }
);

Document.prototype.methods.save = function osmosSaveDocument(callback) {
    var hookPayload = {
        document: this,
        data : JSON.parse(JSON.stringify(this)),
        errors: []
    };

    if (this.errors.length) return callback(this.errors);

    this.performHookCycle(
        'Save',
        
        hookPayload,
        
        function osmosDocumentSaveDocumentOperationCallback(callback) {
            if (hookPayload.errors.length) {
                return callback(hookPayload.errors);
            }
            
            this.methods.validate.call(this, function(error) {
                if (error) {
                    hookPayload.errors = hookPayload.errors.concat(error);
                    return callback(error);
                }
                
                function localCallback(error) {
                    if (error) {
                        hookPayload.errors = hookPayload.errors.concat(error);
                    }
                    
                    callback(error);
                }
        
                if (this.primaryKey) {
                    this.model.db.put(this.model.bucket, this, hookPayload.data, localCallback);
                } else {
                    this.model.db.post(this.model.bucket, this, hookPayload.data, localCallback);
                }
            }.bind(this));
        }.bind(this),
        
        function() {
            callback(hookPayload.errors.length ? hookPayload.errors : null);
        }
    );
};
    
Document.prototype.methods.delete = function osmosDeleteDocument(callback) {
    if (!this.schema.primaryKey) {
        throw new Error('The schema on which this document is based does not have a primary key.');
    }
    
    var hookPayload = {
        document : this,
        spec : {},
        errors : []
    };
    
    hookPayload.spec[this.schema.primaryKey] = this.primaryKey;
    
    this.performHookCycle(
        'Delete',
        
        hookPayload,
        
        function osmosDocumentDeleteDocumentOperationCallback(callback) {
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

module.exports = Document;