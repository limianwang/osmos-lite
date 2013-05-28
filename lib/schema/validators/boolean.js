var expect = require('../../util/expect');

module.exports = function osmosBooleanValidator(document, key, value, callback) {
    expect(value, 'This value must be a Boolean value', callback).to.be.a('boolean');
}