'use strict';

var chai = require('chai');
var expect = chai.expect;
var drivers = require('../lib/drivers');

chai.config.includeStack = true;
describe('Driver Test', function() {
  it('should be able to catch error when driver not found', function() {
    function erroneous() {
      var t = drivers.instance('rubbish');

      return t;
    }

    expect(erroneous).to.throw(Error);
  });
});
