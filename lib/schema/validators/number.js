var expect = require('../../util/expect');
var Error = require('../../error');

module.exports = function osmosNumberValidator(document, field, value) {
    if (typeof value !== 'number') {
        return new Error('This value must be a number', 400);
    }
}