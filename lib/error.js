var util = require('util');

var OsmosError = function OsmosError(message, statusCode) {
    this.statusCode = statusCode || 500;
    Error.apply(this, [message]);
};

util.inherits(OsmosError, Error);

module.exports = OsmosError;
