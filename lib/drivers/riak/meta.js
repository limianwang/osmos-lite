var Error = require('../../error');

var metaProxy = {
    getOwnPropertyDescriptor : function osmosRiakMetaProxyGetOwnPropertyDescriptor(target, name) {
        if (!name in target.data) {
            return undefined;
        }
        
        var field = target.data[name];
        
        return { 
            configurable : true, 
            enumerable : true,
            writable : true,
            value : field
        };
    },
    
    getOwnPropertyNames : function osmosProxyGetOwnPropertyNames(target) {
        return Object.keys(target.data);
    },
    
    defineProperty : function osmosProxyDefineProperty(target, name, desc) {
        Object.defineProperty(target.data, name, desc);
    },
    
    deleteProperty : function osmosProxyDeleteProperty(target, name) {
        delete target.data[name];
    },
    
    has : function osmosProxyHas(target, name) {
        return name in target.data;
    },
    
    hasOwn : function osmosProxyHasOwn(target, name) {
        return name in target.data;
    },
    
    get : function osmosProxyGet(target, name, receiver) {
        if (!(name in target.data)) {
            throw new Error('The field ' + name + ' is not declared in the document meta object.');
        }
        
        return target.data[name];
    },
    
    set : function osmosProxySet(target, name, value, receiver) {
        target.data[name] = value;
    },
    
    enumerate : function osmosProxyEnumerate(target) {
        var keys = Object.keys(target.data);
        var index = 0;
        
        return {
            next : function next() {
                if (index === keys.length) {
                    throw StopIteration;
                }
                
                return keys[index++];
            }
        };
    },
    
    keys : function osmosProxyKeys(target) {
        return Object.keys(target.data);
    }
};

var Meta = function OsmosRiakMeta(data) {
    this.data = data;
    
    this.data.constructor = Meta;
    
    data.toJSON = function metaToJSON() {
        return this;
    }.bind(data);

    data.inspect = function metaInspect() {
        return JSON.stringify(this);
    }.bind(data);
    
    return Proxy(this, metaProxy);
};

module.exports = Meta;