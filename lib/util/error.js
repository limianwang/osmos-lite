var util = require('util');

var OsmosError = function OsmosError(message, statusCode, errors) {
  Error.call(this, message);
  this.statusCode = (statusCode && statusCode.constructor.name == 'Number') ? statusCode : 500;
  this.errors = (statusCode && statusCode.constructor.name == 'Array') ? statusCode : errors || [];
}

util.inherits(OsmosError, Error);

OsmosError.prototype.toString = function (first_argument) {
  return 'BAAH';
};

module.exports = OsmosError;