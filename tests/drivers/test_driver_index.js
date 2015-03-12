'use strict';

var chai = require('chai');
var expect = chai.expect;

var drivers = require('../../lib/drivers');

chai.config.includeStack = true;

describe('.drivers', function() {
  it('should throw error when instance not found', function() {
    function shouldThrow() {
      return drivers.instance('not_exist');
    }

    expect(shouldThrow).to.throw(Error);
  });

  it('should be able to store an instance and retrieve it', function() {
    var mock = {};
    drivers.register('a', mock);
    var result = drivers.instance('a');

    expect(result).to.deep.equal(mock);
    expect(result).to.equal(mock);
  });
});
