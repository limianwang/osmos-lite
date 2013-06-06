require('harmony-reflect');

var Error = require('./error');

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
                    return target[name];
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

var Document = function OsmosDocument(model, data) {
    this.model = model;
    this.data = data;
    this.properties = {};
    
    this.errors = [];
    
    return Proxy(this, documentProxy);
};

Document.readableProperties = {
    inspect: 1,
    errors: 1,
    model: 1,
    properties: 1,
};

Document.prototype.methods = {
    save : function osmosSaveDocument(callback) {
        if (this.errors.length) return callback(errors);
        
        data = this.methods.toJSON.call(this);
        
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
        var spec = {};
        
        if (!this.model.schema.primaryKey) {
            throw new Error('The schema on which this document is based does not have a primary key.');
        }
        
        spec[this.model.schema.primaryKey] = this.primaryKey;
        
        this.model.db.delete(this.model.bucket, spec, callback);
    },
    
    toJSON: function toJSON() {
        return this.data;
    }
};

Document.prototype.setFieldValue = function osmosDocumentSetFieldValue(fieldName, value) {
    var err = this.model.schema.validateField(this, fieldName, value);
    
    if (err) {
        this.errors.push(err);
    } else {
        this.data[fieldName] = this.model.schema.transformFieldValue(this, fieldName, value);
    }
};
    
Document.prototype.getFieldValue = function osmosDocumentGetFieldValue(fieldName) {
    return this.model.schema.transformedValueOfField(this, fieldName, this.data[fieldName]);
};

Document.prototype.dynamicProperties = {
    primaryKey : {
        get: function getPrimaryKey() {
            if (!this.model.schema.primaryKey) {
                throw new Error('The schema on which this document is based does not have a primary key.');
            }
            
            return this.data[this.model.schema.primaryKey];
        },
        
        set: function setPrimaryKey(value) {
            if (!this.model.schema.primaryKey) {
                throw new Error('The schema on which this document is based does not have a primary key.');
            }
        
            this.setFieldValue(this.model.schema.primaryKey, value);
        }
    },
};

module.exports = Document;