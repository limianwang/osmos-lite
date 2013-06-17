var documentProxy = require('./proxy');
var AbstractDocument = require('./abstractdocument');
var Subdocument = require('./subdocument');
var ArrayProxy = require('./array.js');
var Error = require('../error');

var util = require('util');

var Subdocument = function OsmosSubdocument(model, data, schema, parent, fieldName, validateValue) {
    this.parent = parent;
    this.fieldName = fieldName;
    
    AbstractDocument.call(this, model, data, schema);
    
    if (validateValue) {
        var errors = schema.validateAllFields(this, data);
        
        errors.forEach(function(err) {
            this.reportError(err);
        }, this);
    }
    
    return Proxy(this, documentProxy);
};

util.inherits(Subdocument, AbstractDocument);

module.exports = Subdocument;