var expect = require('../../util/expect');
var async = require('async');

module.exports = function osmosNumberValidator(document, key, value, callback) {
    async.series([
        function(callback) {
            expect(value, 'This value must be a date', callback).to.be.an('object');
        },
        function(callback) {
            expect(value.constructor.name, 'This value must be a date', callback).to.equal('Date');
        },
    ],

    callback);
}