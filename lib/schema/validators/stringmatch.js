var Error = require('../../error');
var expect = require('../../util/expect');

function osmosStringMatchValidatorFunction(regex, errorString) {
    expect(regex.constructor.name).to.equal('RegExp');
    expect(errorString).to.be.a('string');
    
    function osmosStringMatchValidator(document, field, value) {
        if (!String(value).match(regex)) {
            return new Error(errorString, 400);
        }
    }
    
    osmosStringMatchValidator.constructor = require('./validator');
    
    return osmosStringMatchValidator;
}

module.exports = osmosStringMatchValidatorFunction;