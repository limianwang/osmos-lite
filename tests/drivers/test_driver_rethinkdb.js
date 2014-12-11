/*jshint expr:true*/

'use strict';

var Osmos = require('../../lib');
var Schema = Osmos.Schema;
var Model = Osmos.Model;

var RethinkDB = Osmos.drivers.RethinkDB;
var r = require('rethinkdb');

var expect = require('chai').expect;
var async = require('async');

var model;

var schema = new Schema(
  'rethink',
  {
    type: 'object',
    required: [ 'name', 'email' ],
    properties: {
      name: {
        type: 'string'
      },
      email: {
        type: 'string',
        format: 'email'
      },
      id: {
        type: 'string'
      }
    }
  }
  );

schema.primaryKey = 'id';

xdescribe('The RethinkDB driver', function() {
  require('chai').config.includeStack = true;
  var _conn;
  before(function(done) {
    r.connect(
    {
      host: 'localhost',
      port: 28015,
      db: 'osmos'
    },
    function(err, connection) {
      _conn = connection;
      var db = new RethinkDB(connection);

      Osmos.drivers.register('rethinkDB', db);

      model = new Model('RethinkPerson', schema, 'person', 'rethinkDB');

      async.series(
        [
          function(callback) {
            r.dbCreate('osmos').run(connection, function() {
              callback();
            });
          },
          function(callback) {
            r.tableDrop('person').run(connection, function() {
              callback();
            });
          },
          function(callback) {
            r.tableCreate('person').run(connection, function() {
              callback();
            });
          },
          function(callback) {
            r.table('person').indexCreate('email').run(connection, function() {
              callback();
            });
          }
        ],

        function(err) {
          if (err) throw err;

          done();
        }
      );
    }
    );
  });

  after(function(done) {
    r.dbDrop('osmos').run(_conn, function() {
      done();
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
      doc.name = 'Marco';
      doc.email = 'marcot@tabini.ca';

      expect(doc.primaryKey).to.be.undefined;

      doc.save(function(err) {
        expect(err).to.not.be.ok;

        expect(doc.primaryKey).not.to.be.undefined;

        done();
      });
    });
  });

  it('should allow putting documents and reading their key', function(done) {
    model.create(function(err, doc) {
      doc.name = 'Marco';
      doc.email = 'marcot@tabini.ca';

      doc.primaryKey = 'marco';

      doc.save(function(err) {
        expect(err).to.not.be.ok;

        expect(doc.primaryKey).to.equal('marco');

        done();
      });
    });
  });

  it('should allow updating individual fields independently', function(done) {
    model.create(function(err, doc) {
      expect(err).not.to.be.ok;

      doc.name = 'Manu';
      doc.email = 'manu@example.org';

      doc.save(function(err) {
        expect(err).to.not.be.ok;

        model.get(doc.primaryKey, function(err, doc2) {
          async.parallel(
            [
              function(cb) {
                doc2.name = 'Joe';
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
                expect(doc3.name).to.equal('Joe');
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
      doc.name = 'Marco';
      doc.email = 'marcot@tabini.ca';

      doc.primaryKey = 'marco2';

      doc.save(function(err) {
        expect(err).to.not.be.ok;

        model.get('marco2', function(err, doc) {
          expect(err).to.not.be.ok;

          expect(doc).to.be.an('object');
          expect(doc.constructor.name).to.equal('OsmosDataStoreDocument');

          expect(doc.name).to.equal('Marco');
          expect(doc.email).to.equal('marcot@tabini.ca');

          done();
        });
      });
    });
  });

  it('should allow deleting documents by their key', function(done) {
    model.create(function(err, doc) {
      doc.name = 'Marco';
      doc.email = 'marcot@tabini.ca';

      doc.save(function(err) {
        expect(err).to.not.be.ok;

        expect(doc.primaryKey).not.to.be.undefined;

        doc.del(function(err) {
          expect(err).to.not.be.ok;

          model.get(doc.primaryKey, function(err, doc) {
            expect(doc).to.be.undefined;

            done();
          });
        });
      });
    });
  });

  it('should allow querying for individual documents based on secondary indices', function(done) {
    model.create(function(err, doc) {
      doc.name = 'Marco';
      doc.email = 'marcot@tabini.ca';

      doc.save(function() {
        model.findOne(
        {
          search: 'marcot@tabini.ca',
          index: 'email'
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

  it('should allow querying for multiple documents based on secondary indices', function(done) {
    model.create(function(err, doc) {
      doc.name = 'Marco';
      doc.email = 'marcot@tabini.ca';

      doc.save(function() {
        model.find(
        {
          search: 'marcot@tabini.ca',
          index: 'email'
        },

        function(err, result) {
          expect(err).to.not.be.ok;

          expect(result).to.be.an('array');

          result.forEach(function(doc) {
            expect(doc.email).to.equal('marcot@tabini.ca');
          });

          done();
        }
        );
      });
    });
  });

  it('should allow finding number of documents matching spec', function(done) {
    model.create(function(err, doc) {
      doc.name = 'Tester';
      doc.email = 'Osmos@osmos.com';

      doc.save(function() {
        model.count({ search: 'Osmos@osmos.com', index: 'email' }, function(err, count) {
          expect(err).to.not.exist;
          expect(count).to.be.equal(1);

          done();
        });
      });
    });
  });


  it('should allow performing complex queries using a custom function', function(done) {
    model.create(function(err, doc) {
      doc.name = 'Marco';
      doc.email = 'marcot@tabini.ca';

      doc.save(function() {
        model.find(
          function(connection, table, callback) {
            table.getAll('marcot@tabini.ca', { index : 'email' }).run(connection, function(err, cursor) {
              if (err) return callback(err);

              cursor.toArray(callback);
            });
          },

          function(err, result) {
            expect(err).to.not.be.ok;

            expect(result).to.be.an('array');

            result.forEach(function(doc) {
              expect(doc.email).to.equal('marcot@tabini.ca');
            });

            done();
          }
          );
      });
    });
  });
});
