var Error = require('../../error');
var expect = require('../../util/expect');

function osmosStringEnumValidatorFunction(possibleValues, errorString) {
    expect(possibleValues.constructor.name).to.equal('Array');
    expect(errorString).to.be.a('string');
    
    function osmosStringEnumValidator(document, field, value, callback) {
        if (possibleValues.indexOf(value) === -1) {
            return callback(new Error(errorString));
        }
        
        callback();
    }
    
    osmosStringEnumValidator.constructor = require('./validator');
    
    return osmosStringEnumValidator;
}

module.exports = osmosStringEnumValidatorFunction;