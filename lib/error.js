var util = require('util');

var OsmosError = function OsmosError(message, statusCode, constr) {
    this.statusCode = statusCode || 500;
    this.message = message || 'Undefined error';
    Error.captureStackTrace(this, constr || this);
};

util.inherits(OsmosError, Error);

OsmosError.prototype.name = 'Osmos Error';

module.exports = OsmosError;
