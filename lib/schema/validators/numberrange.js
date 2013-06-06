var Error = require('../../error');

function osmosNumberRangeValidatorFunction(min, max) {
    function osmosNumberRangeValidator(document, field, value) {
        if (value < min || value > max) {
            return new Error('This value must be between ' + min + ' and ' + max, 400);
        }
    }
    
    osmosNumberRangeValidator.constructor = require('./validator');
    
    return osmosNumberRangeValidator;
}

module.exports = osmosNumberRangeValidatorFunction;