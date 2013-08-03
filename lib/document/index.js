var documentProxy = require('./proxy');
var AbstractDocument = require('./abstractdocument');
var ArrayProxy = require('./array.js');
var Error = require('../error');

var util = require('util');
var extend = require('node.extend');

var Document = function OsmosDocument(model, data, schema) {
    AbstractDocument.call(this, model, data);
    
    if (model.documentInitializer) {
        model.documentInitializer.apply(this);
    }
    
    return Proxy(this, documentProxy);
};

util.inherits(Document, AbstractDocument);

Document.prototype.readableProperties.primaryKey = 1;
Document.prototype.writeableProperties.primaryKey = 1;

Object.defineProperty(
    Document.prototype,
    'primaryKey',
    {
        enumerable : true,
        configurable : true,
        
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
        originalData: this.originalData,
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
            if (!hookPayload.errors.length) {
                this.originalData = JSON.parse(JSON.stringify(this));
            }
            
            if (callback) callback(hookPayload.errors.length ? hookPayload.errors : null);
        }.bind(this)
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
            if (callback) callback(hookPayload.errors.length ? hookPayload.errors : null);
        }
        
    );
};

// Document.extend = function extendDocument(newClass, oldClass) {
//     util.inherits(newClass, oldClass);
//     newClass.prototype.methods = extend({}, newClass.prototype.methods);
// };

module.exports = Document;