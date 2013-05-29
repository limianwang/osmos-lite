var expect = require('../../util/expect');

module.exports = function osmosArrayValidator(document, field, value, callback) {
    expect(value, 'This value must be an array', callback).to.be.an('array');
}