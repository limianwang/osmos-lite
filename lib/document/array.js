var Error = require('../error');
var util = require('util');
var async = require('async');

function OsmosArrayProxy() {};

var ArrayProxy = {
    get: function osmosArrayProxyGet(target, name, receiver) {
        if (isNaN(name)) {
            return target[name];
        }
        
        name = parseInt(name);
        
        if (name >= target.length) {
            throw new Error('Index ' + name + ' exceeds array length ' + target.length);
        }
        
        return target.schema.transformedValueOfField(target.document, target.fieldName, target[name], true);
    },
    
    set: function osmosArrayProxySet(target, name, value, receiver) {
        if (name === 'length') {
            target.length = value;
            return;
        }
        
        if (!isNaN(name)) {
            var err = target.document.validateField(target.fieldName, value, true);
            
            if (err) {
                if (target.document.parent) {
                    target.document.parent.errors.push(err);
                } else {
                    target.document.errors.push(err);
                }
            } else {
                value = target.schema.transformFieldValue(target.document, target.fieldName, value);
                
                var field = target.field;
                
                if (field.subdocumentSchema) {
                    var Subdocument = require('./subdocument');
                    
                    target[name] = new Subdocument(
                        target.document.model, 
                        value, 
                        field.subdocumentSchema, 
                        target.document.parent || target.document, 
                        (target.document.parent ? target.document.fieldName + '.' : '') + target.fieldName, 
                        true);
                } else {
                    target[name] = value;
                }
            }
            
            return;
        }
        
        throw new Error('Cannot set index ' + name);
    },
    
    construct: function osmosArrayProxyConstruct(target, args) { // args = document, fieldName, data
        var document = args[0];
        var fieldName = args[1];
        var data = args[2];
        
        var result = (data && data.constructor.name === 'Array') ? data : new Array();
        
        result.document = document;
        result.fieldName = fieldName;
        result.schema = document.model.schema;

        result.field = result.schema.fields[fieldName];
        
        if (result.field.subdocumentSchema) {
            var Subdocument = require('./subdocument');
        
            result.map(function(value, index) {
                this[index] = new Subdocument(
                    this.document.model, 
                    value, 
                    this.field.subdocumentSchema, 
                    this.document.parent || this.document, 
                    (this.document.parent ? this.document.fieldName + '.' : '') + this.fieldName, 
                    false);                
            }, result);
        }
                
        Object.defineProperty(
            result,
            '__raw__',
            {
                configurable: false,
                enumerable: true,
                get: function osmosGetArrayRawRepresentation() {
                    return this;
                }
            }
        );
        
        result.append = function osmosArrayProxyAppend() {
            var field = this.field;
            
            if (!field.subdocumentSchema) {
                throw new Error('The append method can only be called on an array of subdocuments.');
            }
            
            var Subdocument = require('./subdocument');
            
            var result = new Subdocument(
                this.document.model, 
                {}, 
                field.subdocumentSchema, 
                this.document.parent || this.document, 
                (this.document.parent ? this.document.fieldName + '.' : '') + this.fieldName, 
                false);
                
            this.__raw__.push(result);
            
            return result;
        }
        
        result.validate = function osmosArrayProxyValidate(callback) {
            if (this.schema.fields[fieldName].subdocumentSchema) {
                async.map(
                    this,
                    
                    function mapper(doc, callback) {
                        doc.validate(callback);
                    },
                    
                    function finalCallback(err, errors) {
                        errors = errors.reduce(function errorReducer(previousValue, currentValue) {
                            if (currentValue) {
                                previousValue.concat(currentValue);
                            }
                            
                            return previousValue;
                        }, []);
                        
                        callback(errors.length ? errors : undefined);
                    }
                );
            }
        }
        
        result.toJSON = function osmosArrayProxyToJSON() {
            return Array.prototype.slice.apply(this);
        }
        
        result.inspect = function osmosArrayProxyInspect() {
            return util.inspect(this.toJSON());
        }
        
        return Proxy(result, ArrayProxy);
    }
};

module.exports = Proxy(Array, ArrayProxy);
