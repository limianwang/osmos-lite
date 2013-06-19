var ArrayProxy = require('./array.js');
var Error = require('../error');

var AbstractDocument = function OsmosAbstractDocument(model, data, schema) {
    this.model = model;
    this.schema = schema || model.schema;
    this.data = data;
    this.properties = {};
    
    this.errors = [];
    
    this.schema.fieldNames.forEach(function(fieldName) {
        var field = this.schema.fields[fieldName];
        
        if (field.arrayTypeValidator) {
            this.data[fieldName] = new ArrayProxy(this, fieldName, this.data[fieldName]);
        }
        
        if (field.subdocumentSchema && !field.arrayTypeValidator) {
            var Subdocument = require('./subdocument');
            
            this.data[fieldName] = new Subdocument(model, this.data[fieldName] || {}, field.subdocumentSchema, this.parent || this, (this.parent ? this.fieldName + '.' : '') + fieldName);
        }
    }, this);
};

AbstractDocument.prototype.readableProperties = {
    inspect: 1,
    errors: 1,
    model: 1,
    properties: 1,
    toJSON: 1,
};

AbstractDocument.prototype.methods = {
    validate : function osmosValidateDocument(callback) {
        this.schema.validateDocument(this, this.data, callback);
    },
};

AbstractDocument.prototype.validateField = function validateField(fieldName, rawData) {
    return this.schema.validateField(this, fieldName, rawData, false);
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
    var err = this.schema.validateField(this, fieldName, value);
    
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