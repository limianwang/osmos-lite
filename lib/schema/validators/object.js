var expect = require('../../util/expect');

module.exports = function osmosObjectValidator(document, field, value, callback) {
    expect(value, 'This value must be an object', callback).to.be.an('object');
}