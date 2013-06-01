var Field = require('./field');
var Error = require('../error');

var Schema = function OsmosSchema(spec) {
    this.fields = {};
    this.constructor = Schema;
    this.primaryKey = null;
    
    Object.keys(spec).forEach(function(key) {
        var field = new Field(key, spec[key]);
        
        if (this.primaryKey) {
            if (schema.primaryKey) {
                throw new Error('The field ' + key + ' cannot be a primary key, because ' + schema.primaryKey + ' has already been declared as such.');
            }
            
            this.primaryKey = key;
        }
        
        this.fields[key] = field;
    }, this);
};

Schema.prototype = {
    validate : function(callback) {
        // By default, do nothing but call the callback
        callback();
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