var expect = require('../../util/expect');

module.exports = function osmosNumberValidator(document, field, value, callback) {
    expect(value, 'This value must be a number', callback).to.be.a('number');
}