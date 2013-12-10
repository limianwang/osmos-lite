'use strict';

var mysql = require('mysql');
var util = require('util');

var OsmosError = require('../util/error');

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

Driver.prototype.isUnsigned = function isMySQLFieldUnsigned(field) {
  return (/unsigned/).test(field);
};

Driver.prototype.fieldSize = function(field) {
  var result = field.match(/\((\d+)\)/);

  return result ? Number(result[1]) : 0;
};

Driver.prototype.fieldRange = function(field) {
  var result = field.match(/\((\d+),\s*(\d+)\)/);

  return result ? { left : result[1], right : result[2] } : null;
};

Driver.prototype.numericField = function generateNumericFieldPropertyDescription(field, exponent, isFloat) {
  var property = {
    type: isFloat ? 'number' : 'integer'
  };

  if (this.isUnsigned(field.Type)) {
    property.minimum = 0;
    property.maximum = Math.pow(2, exponent) - 1;
  } else {
    property.minimum = -Math.pow(2, exponent - 1);
    property.maximum = Math.pow(2, exponent - 1) - 1;
  }

  return property;
};

Driver.prototype.generateSchema = function generateMySQLTableSchema(table, fields, cb) {
  if (util.isArray(fields)) {
    fields.map(String.toLowerCase.apply);
  } else {
    cb = fields;
    fields = null;
  }

  var self = this;

  this.pool.getConnection(function(err, db) {
    if (err) {
      cb(err);
      return;
    }

    db.query(
      'DESC ??',
      [table],
      function (err, results) {
        if (err) {
          cb(err);
          return;
        }

        var schema = {
          type: 'object',
          required: [],
          properties: {}
        };

        var done = results.every(function(field) {
          if (fields && fields.indexOf(field.Field) == -1) return;

          var rawType = field.Type.match(/^[a-zA-Z]+/, '')[0];

          var property;

          switch(rawType) {
            case 'int':
              property = self.numericField(field, 32);
              break;

            case 'smallint':
              property = self.numericField(field, 16);
              break;

            case 'mediumint':
              property = self.numericField(field, 24);
              break;

            case 'tinyint':
              property = self.numericField(field, 8);
              break;

            case 'bigint':
              property = self.numericField(field, 64);
              break;

            case 'decimal':
            case 'numeric':
              property = {
                type: 'string',
                pattern: '/\\-?\\d{0,' +
                         (self.fieldRange(field.Type).left - self.fieldRange(field.Type).right) +
                         '}\\.?\\d{0,' +
                         self.fieldRange(field.Type).right + '}/'
              };
              break;

            case 'float':
            case 'double':
              property = {
                type: 'number'
              };
              break;

            case 'date':
            case 'datetime':
            case 'timestamp':
              property = {
                type: 'date'
              };
              break;

            case 'time':
              property = {
                type: 'string'
              };
              break;

            case 'year':
              property = {
                type: 'integer',
                minimum: 0,
                maximum: (self.fieldSize(field.Type) == 2) ? 99 : 99999
              };
              break;

            case 'char':
            case 'varchar':
              property = {
                type: 'string',
                maxLength: self.fieldSize(field.Type)
              };
              break;

            case 'varbinary':
            case 'binary':
              property = {
                type: 'object',
                format: 'binary',
                maxLength: self.fieldSize(field.Type)
              };
              break;

            case 'tinyblob':
              property = {
                type: 'object',
                format: 'buffer',
                maxLength: 255
              };
              break;

            case 'blob':
              property = {
                type: 'object',
                format: 'buffer',
                maxLength: 65535
              };
              break;

            case 'mediumblob':
              property = {
                type: 'object',
                format: 'buffer',
                maxLength: 16777215
              };
              break;

            case 'longblob':
              property = {
                type: 'object',
                format: 'buffer',
                maxLength: 4294967295
              };
              break;

            case 'tinytext':
              property = {
                type: 'object',
                maxLength: 255
              };
              break;

            case 'mediumtext':
              property = {
                type: 'string',
                maxLength: 16777215
              };
              break;

            case 'longtext':
              property = {
                type: 'string',
                maxLength: 4294967295
              };
              break;

            case 'text':
              property = {
                type: 'string',
                maxLength: 65535
              };
              break;

            case 'enum':
              property = {
                type: 'string',
                enum: field.Type.match(/\(([^\)]+)\)/)[1].replace(/'/g, '').split(',')
              };
              break;

            case 'set':
              property = {
                type: 'string',
              };
              break;

            default:
              cb(new OsmosError('Unknown field type ' + field.Type, 500));
              return false;
          }

          schema.properties[field.Field] = property;

          if (field.Null == 'NO') schema.required.push(field.Field);

          return true;
        });

        if (done) cb(null, schema);
      }
    );

    db.release();
  });
};

module.exports = Driver;