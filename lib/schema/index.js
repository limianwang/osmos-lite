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
        
        this.fieldNames.forEach(function(fieldName) {
            var field = this.fields[fieldName];
            
            if (field.required && !field.primaryKey) {
                if (field.arrayTypeValidator) {
                    if (rawData[fieldName].length === 0) {
                        errors.push(new Error('This field must contain at least one item.', 400, null, (document.parent ? document.fieldName + '.' : '') + fieldName));
                    }
                } else {
                    if (!rawData[fieldName]) {
                        errors.push(new Error('This value is required.', 400, null, (document.parent ? document.fieldName + '.' : '') + fieldName));
                    }
                }
            }
            
            if (field.subdocumentSchema) {
                var doc = rawData[fieldName];
                
                doc.validate(function(errs) {
                    if (errs) {
                        errors = errors.concat(errs);
                    }
                });
                
            }
        }, this);
        
        if (this.validate) {
            this.validate(document, rawData, function(errs) {
                if (document.parent) {
                    errs.forEach(function(err) {
                        err.fieldName = document.fieldName + '.' + err.fieldName;
                    });
                }
                
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
        } else if(field.subdocumentSchema) {
            if (value.constructor.name !== 'Object') {
                return new Error('This value must be an object.', 400, undefined, field.name);
            }

            // The validation of the individual fields is done upon construction of the subdocument
        } else {
            return performValidation(value);
        }
    },
    
    validateAllFields: function validateAllFields(document, rawData) {
        var errors = [];
        
        this.fieldNames.forEach(function(fieldName) {
            var err = this.validateField(document, fieldName, rawData[fieldName]);
            
            if (err) {
                errors.push(err);
            }
        }, this);
        
        return errors;
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
    
    transformedValueOfField: function transformedFieldValue(document, fieldName, value, isInnerRequest) {
        var field = this.fields[fieldName];
        
        if (!field) {
            throw new Error('Invalid field name ' + fieldName);
        }
        
        if ((field.arrayTypeValidator || field.subdocumentSchema) && !isInnerRequest) {
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