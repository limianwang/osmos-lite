'use strict';

var chai = require('chai');
var expect = chai.expect;

var Hookable = require('../lib/util/hookable');

chai.config.includeStack = true;

describe('hookable', function() {
  it('should be able to create a hookable child', function() {
    function shouldThrowError() {
      var hook = new Hookable();
    }

    expect(shouldThrowError).to.throw(Error);
  });

  it('should be throwing error on invalid hook', function() {
    Hookable.prototype.hooks = [
      'test'
    ];

    var hook = new Hookable();

    function a() {
      hook.callHook('fun');
    }

    function b() {
      hook.hook('fun');
    }

    function c() {
      hook.unhook('fun');
    }

    function d() {
      hook.unhook('test');
    }

    expect(a).to.throw(Error);
    expect(b).to.throw(Error);
    expect(c).to.throw(Error);
    expect(d).to.throw(Error);
  });
});
