var Field = require('./field');

var Schema = function OsmosSchema(spec) {
    this.fields = {};
    this.constructor = Schema;
    
    Object.keys(spec).forEach(function(key) {
        this.fields[key] = new Field(key, spec[key]);
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