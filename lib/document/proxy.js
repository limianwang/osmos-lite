require('harmony-reflect');

var Error = require('../error');

var documentProxy = {
    getOwnPropertyDescriptor : function osmosProxyGetOwnPropertyDescriptor(target, name) {
        if (!name in target.schema.fields) {
            throw new Error('The field ' + name + ' is not declared in the document schema.');
        }
        
        var field = target.schema.fields[name];
        
        return { 
            configurable : true, 
            enumerable : true,
            writable : !field.readOnly,
            required : field.required,
            value : documentProxy.get(target, name, documentProxy)
        };
    },
    
    getOwnPropertyNames : function osmosProxyGetOwnPropertyNames(target) {
        return target.schema.fieldNames;
    },
    
    defineProperty : function osmosProxyDefineProperty(target, name, desc) {
        throw new Error('You cannot add properties to a document directly.');
    },
    
    deleteProperty : function osmosProxyDeleteProperty(target, name) {
        throw new Error('You cannot delete properties from a document.');
    },
    
    has : function osmosProxyHas(target, name) {
        return name in target.schema.fields;
    },
    
    hasOwn : function osmosProxyHasOwn(target, name) {
        return name in target.schema.fields;
    },
    
    get : function osmosProxyGet(target, name, receiver) {
        if (name === 'constructor') {
            return target.constructor;
        }
        
        if (name in target.schema.fields) {
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
                
                if (name in target.readableProperties) {
                    var field = target[name];
                    
                    if (field && field.bind) {
                        return field.bind(target);
                    } else {
                        return field;
                    }
                }
        }
        
        throw new Error('Field ' + name + ' not found in the document schema.');
    },
    
    set : function osmosProxySet(target, name, value, receiver) {
        if (name in target.schema.fields) {
            return target.setFieldValue.call(target, name, value);
        }
        
        var setter;
        
        if (name in target.writeableProperties) {
            target[name] = value;
            
            return;
        }
        
        if (name in target.dynamicProperties) {
            setter = target.dynamicProperties[name].set;
            
            if (!setter) {
                throw new Error('The dynamic property ' + name + ' is read-only.');
            }
            
            return setter.call(target, value);
        }
        
        if (name in target.model.documentProperties) {
            setter = target.model.documentProperties[name].set;
            
            if (!setter) {
                throw new Error('The model dynamic property ' + name + ' is read-only.');
            }
            
            return setter.call(target, value);
        }
        
        throw new Error('Field ' + name + ' not found in the document schema.');
    },
    
    enumerate : function osmosProxyEnumerate(target) {
        var keys = target.schema.fieldNames;
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
        return target.schema.fieldNames;
    }
}

module.exports = documentProxy;