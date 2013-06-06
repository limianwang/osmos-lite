var expect = require('../../util/expect');
var Error = require('../../Error');

module.exports = function osmosNumberValidator(document, field, value) {
    if (value.constructor.name !== 'Date') {
        return new Error('This value must be a date object', 400);
    }
}