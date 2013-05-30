var Error = require('../../error');

function osmosNumberRangeValidatorFunction(min, max) {
    function osmosNumberRangeValidator(document, field, value, callback) {
        if (value < min || value > max) {
            return callback(new Error('This value must be between ' + min + ' and ' + max));
        }
        
        callback();
    }
    
    osmosNumberRangeValidator.constructor = require('./validator');
    
    return osmosNumberRangeValidator;
}

module.exports = osmosNumberRangeValidatorFunction;