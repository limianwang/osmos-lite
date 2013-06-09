var Field = require('./field');
var Error = require('../error');
var async = require('async');

var Schema = function OsmosSchema(spec) {
    this.fields = {};
    this.fieldNames = Object.keys(spec);
    this.constructor = Schema;
    this.primaryKey = null;
    
    Object.keys(spec).forEach(function(key) {
        var field = new Field(key, spec[key]);
        
        if (field.primaryKey) {
            if (this.primaryKey) {
                throw new Error('The field ' + key + ' cannot be a primary key, because ' + schema.primaryKey + ' has already been declared as such.');
            }
            
            this.primaryKey = key;
        }
        
        this.fields[key] = field;
    }, this);
};

Schema.prototype = {
    validateDocument: function validateDocument(document, rawData, callback) {
        var errors = [];
        
        this.fieldNames.forEach(function(name) {
            var field = this.fields[name];
            
            if (field.required && !field.primaryKey) {
                if (field.arrayTypeValidator) {
                    if (rawData[name].length === 0) {
                        errors.push(new Error('This field must contain at least one item.', 400, null, name));
                    }
                } else {
                    if (!rawData[name]) {
                        errors.push(new Error('This value is required.', 400, null, name));
                    }
                }
            }
        }, this);
        
        if (this.validate) {
            this.validate(document, rawData, function(errs) {
                errors = errors.concat(errs);
                callback(errors.length > 0 ? errors : undefined);
            });
        } else {
            callback(errors.length > 0 ? errors : undefined);
        }
    },
    
    validateField: function validateField(document, fieldName, value, ignoreSubtype) {
        var field = this.fields[fieldName];
        
        if (!field) {
            throw new Error('Invalid field name ' + fieldName);
        }
        
        function performValidation(value) {
            var error;
        
            field.validators.every(function(validator) {
                error = validator(document, field, value);
            
                if (error) {
                    error.fieldName = fieldName;
                
                    return false;
                }
            
                return true;
            });

            return error;
        }
        
        if (field.arrayTypeValidator && !ignoreSubtype) {
            if (value.constructor.name !== 'Array') {
                return new Error('This value must be an array.', 400, undefined, field.name);
            }
            
            var error;
            var index = 0;;
            
            value.every(function(value) {
                error = performValidation(value);
                
                if (error) {
                    error.message = '[Item #' + index + ']: ' + error.message;
                    return false;
                }
                
                index += 1;

                return true;
            }, this);
            
            return error;
        } else {
            return performValidation(value);
        }
        
    },
    
    transformFieldValue: function transformFieldValue(document, fieldName, value) {
        var field = this.fields[fieldName];
        
        if (!field) {
            throw new Error('Invalid field name ' + fieldName);
        }
        
        field.transformers.every(function(transformer) {
            value = transformer.set(document, field, value);
            
            if (value.constructor.name === 'OsmosError') {
                return false;
            }
        }, this);
        
        return value;
    },
    
    transformedValueOfField: function transformedFieldValue(document, fieldName, value, isArrayRequest) {
        var field = this.fields[fieldName];
        
        if (!field) {
            throw new Error('Invalid field name ' + fieldName);
        }
        
        if (field.arrayTypeValidator && !isArrayRequest) {
            return value;
        }
        
        field.transformers.every(function(transformer) {
            value = transformer.get(document, field, value);
            
            if (value.constructor.name === 'OsmosError') {
                return false;
            }
        }, this);

        return value;        
    }
};

Schema.Field = Field;

Schema.Configurator = require('./configurators').Configurator;
Schema.configurators = require('./configurators').configurators;

Schema.TypeValidator = require('./validators').TypeValidator;
Schema.Validator = require('./validators').Validator;
Schema.validators = require('./validators').validators;

Schema.Transformer = require('./transformers').Transformer;
Schema.transformers = require('./transformers').transformers;

module.exports = Schema;