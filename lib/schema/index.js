var Field = require('./field');

var Schema = function OsmosSchema(spec) {
    this.fields = {};
    
    Object.keys(spec).forEach(function(key) {
        this.fields[key] = new Field(spec[key]);
    });
};

Schema.prototype = {
    validate : function(callback) {
        // By default, do nothing but call the callback
    }
};

Schema.Configurator = require('./configurators').Configurator;
Schema.configurators = require('./configurators').configurators;

Schema.TypeValidator = require('./validators').TypeValidator;
Schema.Validator = require('./validators').Validator;
Schema.validators = require('./validators').validators;

Schema.Transformer = require('./transformers').Transformer;
Schema.transformers = require('./transformers').transformers;

module.exports = Schema;