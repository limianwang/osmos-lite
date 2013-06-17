var expect = require('../util/expect');
var async = require('async');
var Error = require('../error');
var validators = require('./validators').validators;

var Field = function OsmosField(name, descriptor) {
    this.name = name;
    this.alias = name;
    this.constructor = Field;
    
    this.typeValidator = null;
    this.arrayTypeValidator = null;
    this.subdocumentSchema = null;
    
    this.validators = [];
    this.transformers = [];
    
    this.primaryKey = false;
    this.required = true;
    this.readOnly = false;
    
    expect(descriptor, 'The field ' + name + ' is missing a descriptor').not.to.equal(null);
    expect(descriptor, 'The field ' + name + ' is missing a descriptor').not.to.equal(undefined);
    
    if (descriptor.constructor.name !== 'Array') {
        descriptor = [ descriptor ];
    }
    
    this._loadDescriptor(descriptor);
    this._validateDescriptor();
};

Field.prototype._loadDescriptor = function _loadDescriptor(descriptor) {
    var configurators = [];
    
    descriptor.forEach(function(method) {
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
                this._setTypeValidator(validators.object);
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
                        configurators.push(method);
                        break;
                        
                    case 'OsmosTransformer':
                        this.transformers.push(method);
                        break;
                        
                    default:
                        throw new Error('Invalid object ' + method + ' passed to descriptor of field ' + this.name);
                }
        }
    }, this);
    
    async.each(configurators, function(configurator, callback) {
        configurator(this, callback);
    }.bind(this));
};

Field.prototype._setTypeValidator = function _setTypeValidator(validator) {
    if ([ validators.array , validators.object ].indexOf(validator) === -1) {
        this.validators.push(validator);
    }
    
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
                throw new Error('Multiple type validators in descriptor of field ' + this.name + ': ' + validator + ', and ' + this.typeValidator);
            }
    }
};

Field.prototype._validateDescriptor = function _validateDesciptor() {
    expect(this.name).to.be.a('string');
    expect(this.typeValidator, 'The field ' + this.name + ' does not have a type validator (e.g.: `String`, `Number`, etc.)').to.be.a('function');
    
    switch(this.typeValidator) {
        case validators.array:
            expect(this.arrayTypeValidator, 'The field ' + this.name + ' does not have a valid array type validator.').to.be.a('function');
            break;
            
        case validators.object:
            expect(this.subdocumentSchema, 'The field ' + this.name + ' does not have a subdocument schema.').to.be.an('object');
            expect(this.subdocumentSchema.constructor.name, 'The field ' + this.name + ' does not have a valid subdocument schema.').to.equal('OsmosSchema');
            break;
    }
    
    expect(this.primaryKey && !this.required, 'The field ' + this.name + ' is a primary key and must be marked as required.').to.be.true;
}

module.exports = Field;