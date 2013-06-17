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
    if (this.parent) {
        throw new Error('Subdocuments cannot be explicitly saved.');
    }
    
    if (this.errors.length) return callback(errors);
    
    data = JSON.parse(JSON.stringify(this));
    
    this.schema.validateDocument(this, data, function(errors) {
        if (errors) return callback(errors);
        
        if (this.primaryKey) {
            this.model.db.put(this.model.bucket, this, data, callback);
        } else {
            this.model.db.post(this.model.bucket, this, data, callback);
        }
    }.bind(this));
};
    
Document.prototype.methods.delete = function osmosDeleteDocument(callback) {
    if (this.parent) {
        throw new Error('Subdocuments cannot be explicitly deleted.');
    }
    
    var spec = {};
    
    if (!this.schema.primaryKey) {
        throw new Error('The schema on which this document is based does not have a primary key.');
    }
    
    spec[this.schema.primaryKey] = this.primaryKey;
    
    this.model.db.delete(this.model.bucket, spec, callback);
};

module.exports = Document;