require('harmony-reflect');

var ArrayProxy = require('./array.js');
var Error = require('../error');

var documentProxy = {
    getOwnPropertyDescriptor : function osmosProxyGetOwnPropertyDescriptor(target, name) {
        if (!name in target.model.schema.fields) {
            throw new Error('The field ' + name + ' is not declared in the document schema.');
        }
        
        var field = target.model.schema.fields[name];
        
        return { 
            configurable : true, 
            enumerable : true,
            writable : !field.readOnly,
            required : field.required,
            value : documentProxy.get(target, name, documentProxy)
        };
    },
    
    getOwnPropertyNames : function osmosProxyGetOwnPropertyNames(target) {
        return target.model.schema.fieldNames;
    },
    
    defineProperty : function osmosProxyDefineProperty(target, name, desc) {
        throw new Error('You cannot add properties to a document directly.');
    },
    
    deleteProperty : function osmosProxyDeleteProperty(target, name) {
        throw new Error('You cannot delete properties from a document.');
    },
    
    has : function osmosProxyHas(target, name) {
        return name in target.model.schema.fields;
    },
    
    hasOwn : function osmosProxyHasOwn(target, name) {
        return name in target.model.schema.fields;
    },
    
    get : function osmosProxyGet(target, name, receiver) {
        if (name === 'constructor') {
            return Document;
        }
        
        if (name in target.model.schema.fields) {
            return target.getFieldValue.call(target, name);
        }
        
        switch(name) {
            case '__raw__':
                return target.data;
                
            case '__document__':
                return target;
                
            default:
                
                if (name in target.dynamicProperties) {
                    return target.dynamicProperties[name].get.call(target);
                }
                
                if (name in target.model.documentProperties) {
                    return target.model.documentProperties[name].get.call(target);
                }
                
                if (name in target.methods) {
                    return target.methods[name].bind(target);
                }
                
                if (name in target.model.documentMethods) {
                    return target.model.documentMethods[name].bind(target);
                }
                
                if (name in Document.readableProperties) {
                    var field = target[name];
                    
                    if (field.bind) {
                        return field.bind(target);
                    } else {
                        return target[name];
                    }
                }
        }
        
        throw new Error('Field ' + name + ' not found in the document schema.');
    },
    
    set : function osmosProxySet(target, name, value, receiver) {
        if (name in target.model.schema.fields) {
            return target.setFieldValue.call(target, name, value);
        }
        
        var setter;
        
        if (name in target.dynamicProperties) {
            setter = target.dynamicProperties[name].set;
            
            if (!setter) {
                throw new Error('The dynamic property ' + name + ' is read-only.');
            }
            
            setter.call(target, value);
        }
        
        if (name in target.model.documentProperties) {
            setter = target.model.documentProperties[name].set;
            
            if (!setter) {
                throw new Error('The model dynamic property ' + name + ' is read-only.');
            }
            
            seter.call(target, value);
        }
        
        throw new Error('Field ' + name + ' not found in the document schema.');
    },
    
    enumerate : function osmosProxyEnumerate(target) {
        var keys = target.model.schema.fieldNames;
        var index = 0;
        
        return {
            next : function next() {
                if (index === keys.length) {
                    throw StopIteration;
                }
                
                return keys[index++];
            }
        }
    },
    
    keys : function osmosProxyKeys(target) {
        return target.model.schema.fieldNames;
    }
}

var Document = function OsmosDocument(model, data, parent) {
    this.parent = parent;
    this.model = model;
    this.data = data;
    this.properties = {};
    
    this.errors = [];
    
    var schema = model.schema;
    
    schema.fieldNames.forEach(function(fieldName) {
        var field = schema.fields[fieldName];
        
        if (field.arrayTypeValidator) {
            this.data[fieldName] = new ArrayProxy(this, fieldName, this.data[fieldName]);
        }
    }, this);
    
    return Proxy(this, documentProxy);
};

Document.readableProperties = {
    inspect: 1,
    errors: 1,
    model: 1,
    properties: 1,
    primaryKey: 1,
    toJSON: 1,
};

Document.prototype = {
    get primaryKey() {
        if (this.parent) {
            throw new Error('Subdocuments cannot have primary keys.');
        }
        
        if (!this.model.schema.primaryKey) {
            throw new Error('The schema on which this document is based does not have a primary key.');
        }
        
        return this.data[this.model.schema.primaryKey];
    },
    
    set primaryKey(value) {
        if (this.parent) {
            throw new Error('Subdocuments cannot have primary keys.');
        }
        
        if (!this.model.schema.primaryKey) {
            throw new Error('The schema on which this document is based does not have a primary key.');
        }
    
        this.setFieldValue(this.model.schema.primaryKey, value);
    }
};

Document.prototype.methods = {
    validate : function osmosValidateDocument(callback) {
        this.model.schema.validateDocument(this, data, callback);
    },
    
    save : function osmosSaveDocument(callback) {
        if (this.parent) {
            throw new Error('Subdocuments cannot be explicitly saved.');
        }
        
        if (this.errors.length) return callback(errors);
        
        data = JSON.parse(JSON.stringify(this));
        
        this.model.schema.validateDocument(this, data, function(errors) {
            if (errors) return callback(errors);
            
            if (this.primaryKey) {
                this.model.db.put(this.model.bucket, this, data, callback);
            } else {
                this.model.db.post(this.model.bucket, this, data, callback);
            }
        }.bind(this));
    },
    
    delete : function osmosDeleteDocument(callback) {
        if (this.parent) {
            throw new Error('Subdocuments cannot be explicitly deleted.');
        }
        
        var spec = {};
        
        if (!this.model.schema.primaryKey) {
            throw new Error('The schema on which this document is based does not have a primary key.');
        }
        
        spec[this.model.schema.primaryKey] = this.primaryKey;
        
        this.model.db.delete(this.model.bucket, spec, callback);
    },
};

Document.prototype.toJSON = function osmosDocumentToJSON() {
    return this.data;
};

Document.prototype.setFieldValue = function osmosDocumentSetFieldValue(fieldName, value) {
    var err = this.model.schema.validateField(this, fieldName, value);
    
    if (err) {
        this.errors.push(err);
    } else {
        if (value.constructor.name === 'Array') {
            this.data[fieldName] = new ArrayProxy(this, fieldName, value);
        } else {
            this.data[fieldName] = this.model.schema.transformFieldValue(this, fieldName, value);
        }
    }
};
    
Document.prototype.getFieldValue = function osmosDocumentGetFieldValue(fieldName) {
     return this.model.schema.transformedValueOfField(this, fieldName, this.data[fieldName]);
};

Document.prototype.dynamicProperties = {
};

module.exports = Document;