var expect = require('../../util/expect');
var Error = require('../../error');

module.exports = function osmosBooleanValidator(document, field, value) {
    if (typeof value !== 'boolean') {
        return new Error('This value must be true or false', 400);
    }
}