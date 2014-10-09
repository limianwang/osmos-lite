'use strict';

var mysql = require('mysql');
var async = require('async');

var OsmosError = require('../../util/error');

var objectDiff = require('../../util/objectdiff');

var generateSchema = require('./schema');

var Driver = function OsmosMySQLDriver(pool) {
  this.pool = pool;
};

Driver.createPool = function createMySQLConnectionPool(host, database, user, password, port) {
  var pool = mysql.createPool({
    host: host,
    database: database,
    user: user,
    password: password,
    port: port || 3306
  });

  return pool;
};

Driver.prototype.generateSchema = function(table, fields, cb) {
  generateSchema(this.pool, table, fields, cb);
};

Driver.prototype.create = function createMySQLRow(model, cb) {
  cb(null, {});
};

Driver.prototype.get = function retrieveMySQLRow(model, key, cb) {
  var self = this;

  async.waterfall(
    [
      function getConnection(cb) {
        self.pool.getConnection(cb);
      },

      function queryDatabase(db, cb) {
        var query = 'SELECT ';

        var fields = [];
        var data = Object.keys(model.schema.schema.properties);

        data.forEach(function() {
          fields.push('??');
        });

        query += fields.join(',') + ' FROM ?? WHERE ?? = ? LIMIT 1';

        data.push(model.bucket);
        data.push(model.schema.primaryKey);
        data.push(key);

        db.query(query, data, function(err, result) {
          db.release();
          cb(err, result);
        });
      }
    ],

    function(err, result) {

      if (result.length > 0) {
        cb(err, result[0]);
        return;
      }

      cb(err);
    }
  );
};

Driver.prototype.post = function postMySQLRow(document, data, cb) {
  var self = this;

  async.waterfall(
    [
      function getConnection(cb) {
        self.pool.getConnection(cb);
      },

      function insertData(db, cb) {
        var fields = [];
        var values = [];

        Object.keys(document.model.schema.schema.properties).forEach(function(key) {
          if (document.model.schema.primaryKey == key && document.primaryKey === null) return;

          fields.push(mysql.escapeId(key));
          values.push(mysql.escape(document[key]));
        });

        db.query(
          'INSERT ?? (' + fields.join(',') + ') VALUES (' + values.join(',') + ')',
          [document.model.bucket],
          function(err, result) {
            db.release();

            if (err) {
              cb(err);
              return;
            }

            document.primaryKey = result.insertId;

            cb(null);
          }
        );
      }
    ],

    cb
  );
};

Driver.prototype.put = function updateMySQLRecord(document, data, cb) {
  if (!document.model.schema.primaryKey || !document.primaryKey) {
    throw new OsmosError('You cannot put a document without a primary key');
  }

  var originalPrimaryKey = document.__originalData__[document.model.schema.primaryKey];

  if (originalPrimaryKey === null || originalPrimaryKey === undefined) {
    this.post(document, data, cb);
    return;
  }

  var self = this;

  var changes = objectDiff.diff(document.__originalData__, data);

  if (changes.changed === 'equal') return cb(null); // Nothing to update.

  var diff = [];

  Object.keys(changes.value).forEach(function(key) {
    if (changes.value[key].changed !== 'equal') {
      diff.push(key);
    }
  });

  if (diff.length === 0) {
    cb(null);
    return;
  }

  async.waterfall(
    [
      function getConnection(cb) {
        self.pool.getConnection(cb);
      },

      function updateData(db, cb) {
        var queryParts = [];
        var data = [document.model.bucket];

        diff.forEach(function(key) {
          queryParts.push('??=?');
          data.push(key);
          data.push(document[key]);
        });

        var query = 'UPDATE ?? SET ' + queryParts.join(',') + ' WHERE ?? = ?';

        data.push(document.model.schema.primaryKey);
        data.push(originalPrimaryKey);

        db.query(query, data, function(err, result) {
          db.release();

          cb(err, result);
        });
      }
    ],

    cb
  );
};

Driver.prototype.del = function deleteMySQLRecord(model, key, cb) {
  var self = this;

  async.waterfall(
    [
      function getConnection(cb) {
        self.pool.getConnection(cb);
      },

      function deleteData(db, cb) {
        db.query(
          'DELETE FROM ?? WHERE ?',
          [model.bucket, key],
          function(err, result) {
            db.release();

            cb(err, result);
          }
        );
      }
    ],

    cb
  );
};

Driver.prototype.findOne = function fineOneMySQLRecord(model, spec, cb) {
  var self = this;

  async.waterfall(
    [
      function getConnection(cb) {
        self.pool.getConnection(cb);
      },

      function findData(db, cb) {
        var query = 'SELECT ';

        var fields = [];
        var data = Object.keys(model.schema.schema.properties);

        data.forEach(function() {
          fields.push('??');
        });

        query += fields.join(',') + ' FROM ?? WHERE ';

        data.push(model.bucket);

        if(typeof spec === 'object') {
          var searchVals = [];

          Object.keys(spec).forEach(function(key) {
            var q = {};
            q[key] = spec[key];
            searchVals.push('?');
            data.push(q);
          });
          query += searchVals.join(' AND ');
        } else {
          query += '?';
          data.push(spec);
        }

        query += ' LIMIT 1';

        db.query(query, data, function(err, result) {
          db.release();

          if (result.length > 0) {
            cb(err, result[0]);
            return;
          }

          cb(err);
        });
      }
    ],

    cb
  );
};

Driver.prototype.find = function fineMySQLRecords(model, spec, cb) {
  var self = this;

  async.waterfall(
    [
      function getConnection(cb) {
        self.pool.getConnection(cb);
      },

      function findData(db, cb) {
        var query = 'SELECT ';

        var fields = [];
        var data = Object.keys(model.schema.schema.properties);

        data.forEach(function() {
          fields.push('??');
        });

        query += fields.join(',') + ' FROM ?? WHERE ';

        data.push(model.bucket);

        var searchVals = [];
        if(typeof spec === 'object') {
          Object.keys(spec).forEach(function(key) {
            var q = {};
            q[key] = spec[key];
            searchVals.push('?');
            data.push(q);
          });
          query += searchVals.join(' AND ');
        } else {
          query += '?';
          data.push(spec);
        }

        db.query(query, data, function(err, result) {
          db.release();

          cb(err, result);
        });
      }
    ],

    cb
  );
};

Driver.prototype.findLimit = function(model, spec, start, limit, cb) {
  var self = this;

  async.waterfall(
    [
      function getConnection(cb) {
        self.pool.getConnection(cb);
      },

      function findData(db, cb) {
        var query = 'SELECT SQL_CALC_FOUND_ROWS ';

        var fields = [];
        var data = Object.keys(model.schema.schema.properties);

        data.forEach(function() {
          fields.push('??');
        });

        query += fields.join(',') + ' FROM ?? WHERE ';
        var qs = [];

        data.push(model.bucket);

        if(typeof spec === 'object') {
          var qs = [];
          Object.keys(spec).forEach(function(key) {
            var q = {};
            q[key] = spec[key];
            qs.push('?');
            data.push(q);
          });

          query += qs.join(' AND ');
        } else {
          query += '?';
          data.push(spec);
        }

        query += ' LIMIT ?, ?';

        data.push(start);
        data.push(limit);

        db.query(query, data, function(err, result) {
          cb(err, db, result);
        });
      },

      function determineFoundRows(db, result, cb) {
        db.query('SELECT FOUND_ROWS() AS count', function(err, rowCount) {
          if (err) {
            cb(err);
            return;
          }

          cb(err, { count : rowCount[0].count , docs : result });
        });
      }
    ],

    cb
  );
};

module.exports = Driver;
