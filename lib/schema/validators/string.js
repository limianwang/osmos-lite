var expect = require('../../util/expect');

module.exports = function osmosStringValidator(document, key, value, callback) {
    function internalCallback(err) {
        callback(err);
    }
    
    expect(value, 'This value must be a string', internalCallback).to.be.a('string');
}