var Error = require('../../error');

module.exports = function osmosStringValidator(document, field, value) {
    if (typeof value !== 'string') {
        return new Error('This value must be a string', 400);
    }
}