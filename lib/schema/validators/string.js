var expect = require('../../util/expect');

module.exports = function osmosStringValidator(document, key, value, callback) {
    expect(value, 'This value must be a string', callback).to.be.a('string');
}