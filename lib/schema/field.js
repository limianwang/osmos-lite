var expect = require('../util/expect');
var Error = require('../error');
var validators = require('./validators').validators;

var Field = function OsmosField(name, spec) {
    this.name = name;
    this.constructor = Field;
    
    this.typeValidator = null;
    this.arrayTypeValidator = null;
    this.subdocumentSchema = null;
    
    this.configurators = [];
    this.validators = [];
    this.transformers = [];
    
    this.required = true;
    
    expect(spec, 'The field ' + name + ' was described by something other than an array').to.be.an('array');
    
    spec.forEach(function(method) {
        switch(method) {
            case String:
                this._setTypeValidator(validators.string);
                break;
                
            case Number:
                this._setTypeValidator(validators.number);
                break;
                
            case Boolean:
                this._setTypeValidator(validators.boolean);
                break;
                
            case Date:
                this._setTypeValidator(validators.date);
                break;
                
            case Buffer:
                this._setTypeValidator(validators.buffer);
                break;
                
            case Array:
                this._setTypeValidator(validators.array);
                break;
                
            case Object:
                this._setTypeValidator(validators.array);
                break;
                
            default:
                
                switch(method.constructor.name) {
                    case 'OsmosSchema':
                        this.subdocumentSchema = method;
                        break;
                        
                    case 'OsmosValidator':
                        this.validators.push(method);
                        break;
                        
                    case 'OsmosConfigurator':
                        this.configurators.push(method);
                        break;
                        
                    case 'OsmosTransformer':
                        this.transformers.push(method);
                        break;
                        
                    default:
                        throw new Error('Invalid object ' + method + ' passed to descriptor of field ' + name);
                }
        }
    });
};

Field.prototype._setTypeValidator = function _setTypeValidator(validator) {
    switch(this.typeValidator) {
        case undefined:
        case null:
            this.typeValidator = validator;
            break;
            
        case validators.array:
            this.arrayTypeValidator = validator;
            break;
            
        default:
            if (validator === validators.array) {
                this.arrayTypeValidator = this.typeValidator;
                this.typeValidator = validator;
            } else {
                throw new Error('Multiple type validators in descriptor of field ' + this.name + ' ' + validator + ', ' + this.typeValidator);
            }
    }
};