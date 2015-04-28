/*jshint expr:true*/

'use strict';

var Osmos = require('../../lib');
var Schema = Osmos.Schema;
var Model = Osmos.Model;

var MySQL = Osmos.drivers.MySQL;

var expect = require('chai').expect;
var async = require('async');
var fs = require('fs');
var path = require('path');

var driver;
var schema;
var model;

xdescribe('The MySQL driver', function() {

  before(function(done) {
    var pool = MySQL.createPool('localhost', 'osmos', 'root');

    async.waterfall(
      [
        function(cb) {
          pool.getConnection(cb);
        },
        function (db, cb) {
          expect(db).to.be.an('object');

          var commands = [];

          fs.readFileSync(path.join(__dirname, '../fixtures/mysql_fixtures.sql')).toString().split('###').forEach(function(command) {
            command = command.trim();

            if (command.length) commands.push(command);
          });

          async.each(
            commands,
            function(command, cb) {
              db.query(command, cb);
            },
            cb
          );
        }
      ],

      function (err) {
        expect(err).not.to.be.ok;

        driver = new MySQL(pool);

        Osmos.drivers.register('mysql', driver);

        driver.generateSchema('sales', function(err, result) {
          expect(err).not.to.be.ok;
          expect(result).to.be.an('object');

          schema = new Schema('mysql', result);

          schema.primaryKey = 'orderId';

          model = new Model('mysql', schema, 'sales', 'mysql');

          done();
        });
      }
    );
  });

  it('should properly render a schema from an existing table', function(done) {
    driver.generateSchema('datatypes', function(err, schema) {
      expect(err).not.to.be.ok;

      fs.readFile(path.join(__dirname, '../fixtures/mysql_schema.json'), function(err, json) {
        expect(schema).to.deep.equal(JSON.parse(json));

        done();
      });
    });
  });

  it('should allow creating new documents', function(done) {
    model.create(function(err, doc) {
      expect(err).not.to.be.ok;
      expect(doc).to.be.an('object');
      expect(doc.constructor.name).to.equal('OsmosDataStoreDocument');

      done();
    });
  });

  it('should allow posting documents and reading their key', function(done) {
    model.create(function(err, doc) {
      doc.email = 'marcot@example.com';
      doc.total = 1000;

      doc.save(function(err) {
        expect(err).not.be.ok;
        expect(doc.primaryKey).to.be.a('number');
        expect(doc.primaryKey).to.be.above(0);

        done();
      });
    });
  });

  it('should allow putting documents and reading their key', function(done) {
    model.create(function(err, doc) {
      doc.email = 'marcot@example.com';
      doc.total = 1000;
      doc.primaryKey = 10000;

      doc.save(function(err) {
        expect(err).not.be.ok;
        expect(doc.primaryKey).to.be.a('number');
        expect(doc.primaryKey).to.equal(10000);

        done();
      });
    });
  });

  it('should allow updating individual fields independently', function(done) {
    model.create(function(err, doc) {
      expect(err).not.to.be.ok;

      doc.email = 'manu@example.org';
      doc.total = 1000;

      doc.save(function(err) {
        expect(err).to.not.be.ok;

        model.get(doc.primaryKey, function(err, doc2) {
          async.parallel(
            [
              function(cb) {
                doc2.total = 10100;
                doc2.save(cb);
              },

              function(cb) {
                doc.email = 'joe@example.org';
                doc.save(cb);
              },
            ],

            function(err) {
              expect(err).not.to.be.ok;

              model.get(doc.primaryKey, function(err, doc3) {
                expect(err).not.to.be.ok;

                expect(doc3).to.be.an('object');
                expect(doc3.total).to.equal(10100);
                expect(doc3.email).to.equal('joe@example.org');

                done();
              });
            }
          );

        });
      });
    });
  });

  it('should allow putting and retrieving documents by their key', function(done) {
    model.create(function(err, doc) {
      doc.total = 100;
      doc.email = 'marcot@tabini.ca';

      var key = 100000;

      doc.primaryKey = key;

      doc.save(function(err) {
        expect(err).to.not.be.ok;

        model.get(key, function(err, doc) {
          expect(err).to.not.be.ok;

          expect(doc).to.be.an('object');
          expect(doc.constructor.name).to.equal('OsmosDataStoreDocument');

          expect(doc.total).to.equal(100);
          expect(doc.email).to.equal('marcot@tabini.ca');

          done();
        });
      });
    });
  });

  it('should allow deleting documents by their key', function(done) {
    model.create(function(err, doc) {
      doc.total = 123;
      doc.email = 'marcot@tabini.ca';

      doc.save(function(err) {
        expect(err).to.not.be.ok;

        expect(doc.primaryKey).to.be.a('number').above(0);

        doc.del(function(err) {
          expect(err).to.not.be.ok;

          model.get(doc.primaryKey, function(err, doc) {
            expect(err).not.be.ok;
            expect(doc).to.equal(undefined);

            done();
          });
        });
      });
    });
  });

  it('should allow querying for individual documents', function(done) {
    model.create(function(err, doc) {
      doc.total = 19328;
      doc.email = 'marcot@tabini.ca';

      doc.save(function() {
        model.findOne(
          {
            email: 'marcot@tabini.ca'
          },

          function(err, result) {
            expect(err).to.not.be.ok;

            expect(result).to.be.an('object');
            expect(result.email).to.equal('marcot@tabini.ca');

            done();
          }
        );
      });
    });
  });

  it('should allow querying for individual documents using multiple params', function(done) {
    var test_email = 'test1234@test.ca';
    var test_total = 12333;
    model.create(function(err, doc) {
      doc.total = test_total;
      doc.email = test_email;

      doc.save(function() {
        model.findOne({
          email: test_email,
          total: test_total
        }, function(err, doc) {
          expect(err).to.not.exist;
          expect(doc).to.be.an('object');
          expect(doc.email).to.be.equal(test_email);
          expect(doc.total).to.be.equal(test_total);
          done();
        });
      });
    });
  });

  it('should allow querying all documents using multiple params', function(done) {
    var test_email = 'test1234@test.ca';
    var test_total = 12334555;

    model.create(function(err, doc) {
      doc.total = test_total;
      doc.email = test_email;

      doc.save(function() {
        model.find({
          total: test_total,
          email: test_email
        }, function(err, docs) {
          expect(err).to.not.exist;
          expect(docs).to.be.an('array');
          expect(docs).to.have.length(1);

          done();
        });
      });
    });
  });

  it('should return multiple documents when using find()', function(done) {
    async.series(
      [
        function(cb) {
          model.create(function(err, doc) {
            expect(err).not.to.be.ok;

            doc.total = 123123;
            doc.email = 'marcot@tabini.ca';
            doc.save(cb);
          });
        },

        function(cb) {
          model.create(function(err, doc) {
            expect(err).not.to.be.ok;

            doc.total = 124124;
            doc.email = 'marcot@tabini.ca';
            doc.save(cb);
          });
        },

        function(cb) {
          model.find(
            {
              email: 'marcot@tabini.ca'
            },

            function(err, docs) {
              expect(err).not.to.be.ok;

              expect(docs).to.be.an('array');
              expect(docs.length).to.be.above(1);

              cb(null);
            }
          );
        }
      ],

      done
    );
  });

  it('should return document metadata when using findLimit()', function(done) {
    var email = 'marcot-' + Math.random() + '@tabini.ca';

    this.timeout(15000);

    async.series(
      [
        function(cb) {
          async.each(
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],

            function(datum, cb) {
              model.create(function(err, doc) {
                expect(err).not.to.be.ok;

                doc.total = 123123;
                doc.email = email;
                doc.save(cb);
              });
            },

            cb
          );
        },

        function(cb) {
          model.findLimit(
            {
              email: email,
              total: 123123
            },

            0,

            2,

            function(err, result) {
              expect(err).not.to.be.ok;

              expect(result).to.be.an('object');

              expect(result.count).to.equal(10);
              expect(result.start).to.equal(0);
              expect(result.limit).to.equal(2);
              expect(result.docs).to.be.an('array');
              expect(result.docs.length).to.equal(2);

              cb(null);
            }
          );
        }
      ],

      done
    );
  });

  it('should properly skip documents when using findLimit()', function(done) {
    var email = 'marcot-' + Math.random() + '@tabini.ca';

    this.timeout(15000);

    async.series(
      [
        function(cb) {
          async.each(
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],

            function(datum, cb) {
              model.create(function(err, doc) {
                expect(err).not.to.be.ok;

                doc.total = 12938;
                doc.email = email;
                doc.save(cb);
              });
            },

            cb
          );
        },

        function(cb) {
          model.findLimit(
            {
              email: email
            },

            2,

            10,

            function(err, result) {
              expect(err).not.to.be.ok;

              expect(result).to.be.an('object');

              expect(result.count).to.equal(10);
              expect(result.start).to.equal(2);
              expect(result.limit).to.equal(10);
              expect(result.docs).to.be.an('array');
              expect(result.docs.length).to.equal(8);

              cb(null);
            }
          );
        }
      ],

      done
    );
  });

  it('should be able to count the number of elements in the database', function(done) {
    async.series([
      function(next) {
        model.create(function(err, doc) {
          expect(err).to.not.exist;

          doc.total = 100;
          doc.email = 'test@osmos.com';

          doc.save(function(err) {
            expect(err).to.not.exist;
            next();
          });
        });
      },
      function(next) {
        model.count({ email: 'test@osmos.com' }, function(err, count) {
          expect(err).to.not.exist;
          expect(count).to.be.equal(1);

          next();
        });
      }
    ], function() {
      done();
    });
  });

});
