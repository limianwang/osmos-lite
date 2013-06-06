var expect = require('../../util/expect');
var Error = require('../../error');

module.exports = function osmosArrayValidator(document, field, value) {
    if (value.constructor.name !== 'Array') {
        return new Error('This value must be an array', 400);
    }
}