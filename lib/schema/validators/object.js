var Error = require('../../error');

module.exports = function osmosObjectValidator(document, field, value) {
    if (typeof value !== 'object') {
        return new Error('This value must be an object', 400);
    }
}