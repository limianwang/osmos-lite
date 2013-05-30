var Error = require('../../error');
var expect = require('../../util/expect');

function osmosStringMatchValidatorFunction(regex, errorString) {
    expect(regex.constructor.name).to.equal('RegExp');
    expect(errorString).to.be.a('string');
    
    function osmosStringMatchValidator(document, field, value, callback) {
        if (!String(value).match(regex)) {
            return callback(new Error(errorString));
        }
        
        callback();
    }
    
    osmosStringMatchValidator.constructor = require('./validator');
    
    return osmosStringMatchValidator;
}

module.exports = osmosStringMatchValidatorFunction;