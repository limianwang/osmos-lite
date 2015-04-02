/*jshint expr:true*/

'use strict';

var async = require('async');
var chai = require('chai');
var expect = chai.expect;

var Osmos = require('../lib');

var Schema = Osmos.Schema;
var Model = Osmos.Model;
var Document = Osmos.Document;

var schema, model;

chai.config.includeStack = true;

describe('The Document class', function() {
  before(function() {
    var db = new Osmos.drivers.Memory();

    Osmos.drivers.register('memory', db);

    schema = new Schema(
      'test',
      {
        type: 'object',
        required: [ 'name', 'val' ],
        properties: {
          _primaryKey: {
            type: 'string',
          },

          name: {
            type: 'string'
          },

          email: {
            type: 'string',
            format: 'email'
          },

          age: {
            type: 'number',
            minimum: 0,
            maximum: 99
          },

          val: {
            type: 'number',
            minimum: 1,
            maximum: 2,
          },

          complex: {
            type: 'object',
            default: {}
          },

          data: {
            type: 'string'
          },

          last_update: {                    //jshint ignore:line
            type: 'number'
          },

          arr: {
            type: 'array'
          },

          nullable: {
            anyOf: [{
              type: 'string'
            }, {
              type: 'null'
            }]
          }
        }
      }
    );

    schema.transformers.val = {
      get: function(value) {
        switch(value) {
        case 1:
          return 'one';

        case 2:
          return 'two';

        default:
          return value;
        }
      },

      set: function(value) {
        switch(value) {
        case 'one':
          return 1;

        case 'two':
          return 2;

        default:
          throw new Error('Invalid value `' + value + '`');
        }
      }
    };

    schema.primaryKey = '_primaryKey';

    schema.hook('didValidate', function(payload, cb) {
      if (payload.name == 'fail') return cb(new Osmos.Error('The chicken has fled the coop. I repeat, the chicken has fled the coop.'));

      cb(null);
    });

    model = new Model('TestModel', schema, '', 'memory');

    model.instanceMethods.testFunction = function() {
      return 'ok';
    };

    model.instanceProperties.testProperty = 1;

    model.updateableProperties = ['name', 'arr', 'email', 'age', 'nullable'];

    model.hook('didUpdate', function(payload, cb) {
      payload.doc.last_update = new Date().getTime(); // jshint ignore:line

      cb(null);
    });
  });

  it('should exist', function() {
    expect(Document).to.be.a('function');
  });

  it('should catch error when attempting to update without updateableProperties', function(done) {
    var model = new Model('TestModel', schema, '', 'memory');
    model.create(function(err, doc) {
      doc.update({ a: 'b' }, function(err) {
        expect(err).to.exist;

        done();
      });
    });
  });

  it('should allow writing to properly declared fields', function(done) {
    model.create(function(err, doc) {
      expect(doc).to.be.an('object');
      expect(doc.constructor.name).to.equal('OsmosDataStoreDocument');

      function test() {
        doc.name = 'marco';
      }

      expect(test).not.to.throw(Osmos.Error);

      done();
    });
  });

  it('should refuse writing to a non-existing field', function(done) {
    model.create(function(err, doc) {
      expect(doc).to.be.an('object');
      expect(doc.constructor.name).to.equal('OsmosDataStoreDocument');

      function test() {
        doc.name = 'marco';
        doc.invalid = 'value';
      }

      expect(test).to.throw(Error);

      done();
    });
  });

  it('should allow reading from a declared field', function(done) {
    function test() {
      model.create(function(err, doc) {
        doc.name = 'marco';

        expect(doc.name).to.equal('marco');

        done();
      });
    }

    expect(test).not.to.throw(Osmos.Error);
  });

  it('should refuse reading from an unknown field in debug mode', function(done) {
    Osmos.Document.debug = true;

    model.create(function(err, doc) {
      expect(err).not.to.exist;
      expect(doc).to.be.an('object');

      expect(function() { doc.unknownfielddoesntexist; }).to.throw();

      done();
    });
  });

  it('should not refuse reading from an unknown field in production mode', function(done) {
    Osmos.Document.debug = false;

    model.create(function(err, doc) {
      expect(err).not.to.exist;
      expect(doc).to.be.an('object');

      var x = doc.unknownfielddoesntexist;

      done();
    });
  });

  it('should perform transformations when reading and writing data', function(done) {
    model.create(function(err, doc) {
      doc.val = 'one';

      expect(doc.__raw__.val).to.equal(1);

      expect(doc.val).to.equal('one');
      done();
    });
  });

  it('should allow saving a document', function(done) {
    model.create(function(err, doc) {
      doc.name = 'marco';
      doc.val = 'one';
      expect(doc.complex).to.be.an('object').to.deep.equal({});

      doc.complex.val = 'test';

      doc.save(function(err, doc) {
        expect(err).to.not.exist;
        expect(doc.complex).to.be.an('object').to.deep.equal({ val : 'test'});
        done();
      });
    });
  });

  it('should not require a callback when saving a document', function(done) {
    model.create(function(err, doc) {
      doc.name = 'marco';
      doc.val = 'one';

      doc.save(function(err, doc) {
        expect(err).to.not.be.ok;
        expect(doc).to.have.property('complex').to.deep.equal({});

        done();
      });
    });
  });

  it('should actually save a document', function(done) {
    async.waterfall(
      [
        function(callback) {
          model.create(callback);
        },

        function(doc, callback) {
          doc.name = 'marco';
          doc.val = 'one';

          doc.save(function(err) {
            expect(err).to.not.be.ok;

            callback(null, doc.primaryKey);
          });
        },

        function(primaryKey, callback) {
          model.get(primaryKey, function(err, doc) {
            callback(err, doc, primaryKey);
          });
        },

        function(doc, primaryKey, callback) {
          expect(doc).to.be.an('object');
          expect(doc.constructor.name).to.equal('OsmosDataStoreDocument');

          expect(doc.name).to.be.a('string');
          expect(doc.name).to.equal('marco');

          expect(doc.val).to.be.a('string');
          expect(doc.val).to.equal('one');

          expect(doc.primaryKey).to.be.a('string');
          expect(doc.primaryKey).to.equal(primaryKey);

          callback(null);
        }
      ],

      done
    );
  });

  it('should call the global validator before saving', function(done) {
    model.create(function(err, doc) {
      doc.name = 'fail';
      doc.val = 'one';

      doc.save(function(err) {
        expect(err).to.be.an('object');
        expect(err).to.be.an.instanceOf(Osmos.Error);

        done();
      });
    });
  });

  it('should properly delete a document', function(done) {
    async.waterfall(
      [
        function(callback) {
          model.create(callback);
        },

        function(doc, callback) {
          doc.name = 'marco';
          doc.val = 'one';

          doc.save(function(err) {
            expect(err).to.not.be.ok;

            callback(err, doc);
          });
        },

        function(doc, callback) {
          doc.del(function(err) {
            callback(err, doc.primaryKey);
          });
        },

        function(primaryKey, callback) {
          model.get(primaryKey, function(err, doc) {
            expect(err).to.not.be.ok;
            expect(doc).to.equal(undefined);

            callback(null);
          });
        }
      ],

      function(err) {
        expect(err).to.not.be.ok;

        done();
      }
    );
  });

  it('should throw error when no toJSON specified', function(done) {
    model.create(function(err, doc) {
      expect(err).to.not.exist;

      function wrap() {
        return doc.toJSON();
      }

      expect(wrap).to.throw(Error);
      done();
    });
  });

  it('should be able to inspect', function(done) {
    model.create(function(err, doc) {
      expect(err).to.not.exist;

      var result = doc.inspect();

      expect(result).to.exist;

      done();
    });
  });

  it('should support extension through the instanceMethods property', function(done) {
    model.create(function(err, doc) {
      expect(err).not.to.be.ok;
      expect(doc).to.be.an('object');

      expect(doc.testFunction).to.be.a('function');
      expect(doc.testFunction()).to.equal('ok');

      done();
    });
  });

  it('should support extension through the instanceProperties property', function(done) {
    model.create(function(err, doc) {
      expect(err).not.to.be.ok;
      expect(doc).to.be.an('object');

      function f() {
        doc.testProperty = 123;
        expect(doc.testProperty).to.equal(123);
      }

      expect(f).not.to.throw(Osmos.Error);

      done();
    });
  });

  it('should fail when required field is missing during updates', function(done) {
    model.create(function(err, doc) {
      expect(err).to.not.exist;

      doc.name = 'tester';

      doc.update({ name : '' }, function(err) {
        expect(err).to.not.exist;
        doc.save(function(err) {
          expect(err).to.be.an('object').to.be.an.instanceof(Osmos.Error);
          done();
        });
      });
    });
  });

  it('should support updating a document then changing to empty value', function(done) {
    async.waterfall([
      function(next) {
        model.create(function(err, doc) {
          expect(err).to.not.exist;
          expect(doc).to.be.an('object');
          next(null, doc);
        });
      },
      function(doc, next) {
        doc.name = 'tester';
        doc.val = 'one';
        doc.email = 'test@test.ca';

        doc.save(function(err, doc) {
          expect(err).to.not.exist;
          expect(doc).to.be.an('object').to.have.property('name').to.be.equal('tester');
          next();
        });
      },
      function(next) {
        model.findOne({ name : 'tester' }, function(err, doc) {
          expect(err).to.not.exist;
          doc.update({ email: undefined }, function(err) {
            expect(err).to.not.exist;

            doc.save(function(err, doc) {
              expect(err).to.not.exist;

              expect(doc.email).to.be.undefined;
              next();
            });
          });
        });
      }
    ], function() {
      done();
    });
  });

  it('should be able to set to null after being defined', function(done) {
    model.create(function(err, doc) {
      expect(err).to.not.be.ok;
      expect(doc).to.be.an('object');
      doc.nullable = 'some_test';
      doc.name = 'Marco';

      doc.update({ nullable: null }, function(err) {
        expect(err).to.not.exist;
        expect(doc).to.have.property('nullable').to.be.null;

        done();
      });
    });
  });

  it('should be able to set to 0' , function(done) {
    model.create(function(err, doc) {
      expect(err).to.not.be.ok;

      expect(doc).to.be.an('object');
      doc.age = 10;
      doc.name = 'Marco';

      doc.update({ age: 0 }, function(err) {
        expect(err).to.not.exist;

        expect(doc).to.have.property('age').to.be.equal(0);

        done();
      });
    });
  });

  it('should support updating a document from a JSON payload', function(done) {
    model.create(function(err, doc) {
      expect(err).not.to.be.ok;
      expect(doc).to.be.an('object');

      doc.update({name : 'Marco'}, function(err) {
        expect(err).not.to.be.ok;
        expect(doc.name).to.equal('Marco');

        done();
      });
    });
  });

  it('should support update hooks when updating a document', function(done) {
    model.create(function(err, doc) {
      expect(err).not.to.be.ok;
      expect(doc).to.be.an('object');

      doc.update({name : 'Marco'}, function(err) {
        expect(err).not.to.be.ok;
        expect(doc.name).to.equal('Marco');
        expect(doc.last_update).to.be.above(0); // jshint ignore:line

        done();
      });
    });
  });

  it('should support setting a value to undefined', function(done) {
    function test() {
      model.create(function(err, doc) {
        doc.name = undefined;

        done();
      });
    }

    expect(test).not.to.throw(Error);
  });

  it('should support referenced properties (#7)', function(done) {
    var s1 = {
      id: 'http://example.com/s1',
      properties:{
        type: {
          type: 'string',
          enum:['a','b']
        }
      },
      required: ['type']
    };

    var s2 = {
      id: 'http://example.com/s2',
      properties: {
        name: {
          type: 'string'
        },
      },
      required: ['name'],
      allOf:[{$ref : 'http://example.com/s1' }]
    };

    Schema.registerSchema(s1.id, s1);

    var localSchema = new Schema(s2.id, s2);

    localSchema.primaryKey = 'type';

    var localModel = new Model('LocalModel', localSchema, '', 'memory');

    function test (doc) {
      doc.type = 'a';
      var x = doc.type;
      x = x;
    }

    localModel.create(function(err, doc) {
      expect(err).not.to.be.ok;
      expect(doc).to.be.an('object');

      expect(test.bind(this, doc)).not.to.throw(Error);

      done();
    });
  });

  it('should not support deleting a property', function(done) {
    model.create(function(err, doc) {
      doc.name = 'Marco';

      expect(doc.name).to.equal('Marco');

      function test() {
        delete doc.name;
      }

      expect(test).to.throw(Error);

      done();
    });
  });

  it('should support clearing a document', function(done) {
    model.create(function(err, doc) {
      doc.primaryKey = 'Test';
      doc.name = 'marco';
      doc.age = 12;

      doc.clear();

      expect(doc.toRawJSON()).to.not.include.keys(['name', 'age']);
      expect(doc.primaryKey).to.equal('Test');

      done();
    });
  });

  it('should support wiping the primary key when clearing a document', function(done) {
    model.create(function(err, doc) {
      doc.primaryKey = 'Test';
      doc.name = 'marco';
      doc.age = 12;

      doc.clear(true);

      expect(doc.toRawJSON()).to.not.include.keys(['name', 'age']);
      expect(doc.primaryKey).to.be.undefined;

      done();
    });
  });

  it('should support setting empty values in an update (#8)', function(done) {
    model.create(function(err, doc) {
      doc.name = 'Marco';

      doc.update({ name : undefined }, function(err) {
        expect(err).not.be.ok;
        expect(doc.name).to.be.undefined;

        done();
      });
    });
  });

  it('should support a value called `data`', function(done) {
    model.create(function(err, doc) {
      doc.data = 'Test';

      expect(doc.__raw__.data).to.equal('Test');

      done();
    });
  });

  it('should only update values that exist in a payload without overriding existing properties that have not been set', function(done) {
    model.create(function(err, doc) {
      expect(err).not.to.be.ok;
      expect(doc).to.be.an('object');

      doc.name = 'Marco';

      doc.update({}, function(err) {
        expect(err).not.to.be.ok;
        expect(doc.name).to.equal('Marco');

        done();
      });
    });
  });

  it('should properly support updates to arrays', function(done) {
     model.create(function(err, doc) {
      expect(err).not.to.be.ok;
      expect(doc).to.be.an('object');

      // This test verifies that the data stored in an array inside the document
      // is actually cloned when toRawJSON() is called if you modify the array
      // and then feed that same array to the update() method.
      //
      // If this is not the case, calling save() will fail if the driver
      // uses an object diff between the original contents of the object and
      // the new object, because the array will be the same in both objects.
      //
      // Yeah, it's complicated. That's why it took me two hours to figure
      // out where the problem was and write a working test case for it. —Mt.

      doc.update({arr : ['test']}, function() {
        var originalRaw = doc.toRawJSON();

        expect(originalRaw.arr).to.have.length(1);

        doc.arr.push('toast');

        doc.update({arr : doc.arr}, function() {
          expect(originalRaw.arr).to.have.length(1);

          done();
        });
      });
     });
  });

});
