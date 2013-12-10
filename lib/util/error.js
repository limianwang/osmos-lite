'use strict';

var util = require('util');

var OsmosError = function OsmosError(message, statusCode, errors) {
  Error.call(this);
  Error.captureStackTrace(this, this.constructor);
  
  this.constructor = OsmosError;
  this.name = this.constructor.name;
  this.message = message;
  this.statusCode = (statusCode && statusCode.constructor.name == 'Number') ? statusCode : 500;
  this.errors = (statusCode && statusCode.constructor.name == 'Array') ? statusCode : errors || [];
};

util.inherits(OsmosError, Error);

OsmosError.prototype.inspect = function errorToString() {
  return JSON.stringify('OsmosError: [' + this.statusCode + '] ' + this.message + (this.errors.length ? ' (error count: ' + this.errors.length + ')' : ''));
};

Object.defineProperty(
  OsmosError.prototype,
  'body',
  {
    get: function() {
      return {
        message: this.message,
        statusCode: this.statusCode,
        errors: this.errors
      };
    }
  }
);

module.exports = OsmosError;