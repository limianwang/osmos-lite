var Error = require('../error');

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
            var err = target.schema.validateField(target.document, target.fieldName, value);
            
            if (err) {
                target.document.errors.push(err);
            } else {
                target[name] = target.schema.transformFieldValue(target.document, target.fieldName, value);
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
        
        result.toJSON = function osmosArrayProxyToJSON() {
            return Array.prototype.slice.apply(this);
        }
        
        return Proxy(result, ArrayProxy);
    }
};

module.exports = Proxy(Array, ArrayProxy);
