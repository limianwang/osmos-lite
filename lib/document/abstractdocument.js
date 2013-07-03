var ArrayProxy = require('./array.js');
var Error = require('../error');
var Hookable = require('../hookable');

var util = require('util');

var hooks = [
    'willValidate',
    'didValidate',
    'willSave',
    'didSave',
    'willDelete',
    'didDelete' 
];

var AbstractDocument = function OsmosAbstractDocument(model, data, schema) {
    this.model = model;
    this.schema = schema || model.schema;
    this.data = data;
    this.properties = {};
    
    this.errors = [];
    
    this.schema.fieldNames.forEach(function(fieldName) {
        var field = this.schema.fields[fieldName];
        
        if (field.arrayTypeValidator) {
            this.data[fieldName] = new ArrayProxy(this, fieldName, this.data[fieldName], true);
        }
        
        if (field.subdocumentSchema && !field.arrayTypeValidator) {
            var Subdocument = require('./subdocument');
            
            this.data[fieldName] = new Subdocument(model, this.data[fieldName] || {}, field.subdocumentSchema, this.parent || this, (this.parent ? this.fieldName + '.' : '') + fieldName);
        }
    }, this);
    
    Hookable.apply(this);
    
    hooks.forEach(function(hook) {
        this.registerHook(hook);
    }, this);
};

util.inherits(AbstractDocument, Hookable);

AbstractDocument.prototype.readableProperties = {
    inspect: 1,
    errors: 1,
    model: 1,
    properties: 1,
    toJSON: 1,
};

AbstractDocument.prototype.writeableProperties = {};

AbstractDocument.prototype.methods = {
    validate : function osmosValidateDocument(callback) {
        var hookPayload = {
            document : this,
            errors : []
        };
        
        this.performHookCycle(
            'Validate',
            
            hookPayload,
            
            function osmosDocumentValidateOperationCallback(callback) {
                if (hookPayload.errors.length) {
                    return callback(hookPayload.errors);
                }
                
                this.schema.validateDocument(this, this.data, function(errors) {
                    if (errors) {
                        hookPayload.errors = hookPayload.errors.concat(errors);
                        return callback(errors);
                    }
                    
                    callback();
                });
            }.bind(this),

            function() {
                callback(hookPayload.errors.length ? hookPayload.errors : null);
            }
        )
    },
    
    plugin : function osmosDocumentPlugin(callback) {
        callback(this);
    },
    
    hook : function hook(hook, callback) {
        this.hook(hook, callback);
    },
    
    unhook : function unhook(hook, callback) {
        this.unhook(hook, callback);
    }
};

AbstractDocument.prototype.validateField = function validateField(fieldName, value, ignoreSubtype) {
    return this.schema.validateField(this, fieldName, value, ignoreSubtype);
};

AbstractDocument.prototype.validateAllFields = function validateAllFields(rawData) {
    var errors = [];
    
    this.schema.fieldNames.forEach(function(fieldName) {
        var err = this.validateField(fieldName, rawData[fieldName]);
        
        if (err) {
            errors.push(err);
        }
    }, this);
    
    return errors;
};

AbstractDocument.prototype.reportError = function osmosDocumentReportError(err) {
    if (this.parent) {
        err.fieldName = this.fieldName + '.' + err.fieldName;
        this.parent.errors.push(err);
    } else {
        this.errors.push(err);
    }
};

AbstractDocument.prototype.toJSON = function osmosDocumentToJSON() {
    return this.data;
};

AbstractDocument.prototype.setFieldValue = function osmosDocumentSetFieldValue(fieldName, value) {
    var err = this.validateField(fieldName, value);
    
    if (err) {
        this.reportError(err);
    } else {
        if (value.constructor.name === 'Array') {
            this.data[fieldName] = new ArrayProxy(this, fieldName, value);
        } else if (value.constructor.name === 'Object') {
            var Subdocument = require('./subdocument');
            var schema = this.schema.fields[fieldName].subdocumentSchema;
            
            if (!schema) {
                throw new Error('Object value set for a field that does not support subdocument');
            }
            
            this.data[fieldName] = new Subdocument(this.model, value, schema, this.parent || this, (this.parent ? this.fieldName + '.' : '') + fieldName, true);
        } else {
            this.data[fieldName] = this.schema.transformFieldValue(this, fieldName, value);
        }
    }
};
    
AbstractDocument.prototype.getFieldValue = function osmosDocumentGetFieldValue(fieldName) {
     return this.schema.transformedValueOfField(this, fieldName, this.data[fieldName]);
};

AbstractDocument.prototype.dynamicProperties = {
};

module.exports = AbstractDocument;