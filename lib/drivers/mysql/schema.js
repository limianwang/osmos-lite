var util = require('util');
var OsmosError = require('../../util/error');

function isFieldUnsigned(field) {
  return (/unsigned/).test(field);
};

function fieldSize(field) {
  var result = field.match(/\((\d+)\)/);

  return result ? Number(result[1]) : 0;
};

function fieldRange(field) {
  var result = field.match(/\((\d+),\s*(\d+)\)/);

  return result ? { left : result[1], right : result[2] } : null;
};

function generateNumericFieldPropertyDescription(field, exponent, isFloat) {
  var property = {
    type: isFloat ? 'number' : 'integer'
  };

  if (isFieldUnsigned(field.Type)) {
    property.minimum = 0;
    property.maximum = Math.pow(2, exponent) - 1;
  } else {
    property.minimum = -Math.pow(2, exponent - 1);
    property.maximum = Math.pow(2, exponent - 1) - 1;
  }

  return property;
};

function generateMySQLSchema(pool, table, fields, cb) {
  if (util.isArray(fields)) {
    fields.map(String.toLowerCase.apply);
  } else {
    cb = fields;
    fields = null;
  }

  pool.getConnection(function(err, db) {
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
              property = generateNumericFieldPropertyDescription(field, 32);
              break;

            case 'smallint':
              property = generateNumericFieldPropertyDescription(field, 16);
              break;

            case 'mediumint':
              property = generateNumericFieldPropertyDescription(field, 24);
              break;

            case 'tinyint':
              property = generateNumericFieldPropertyDescription(field, 8);
              break;

            case 'bigint':
              property = generateNumericFieldPropertyDescription(field, 64);
              break;

            case 'decimal':
            case 'numeric':
              property = {
                type: 'string',
                pattern: '/\\-?\\d{0,' +
                         (fieldRange(field.Type).left - fieldRange(field.Type).right) +
                         '}\\.?\\d{0,' +
                         fieldRange(field.Type).right + '}/'
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
                maximum: (fieldSize(field.Type) == 2) ? 99 : 99999
              };
              break;

            case 'char':
            case 'varchar':
              property = {
                type: 'string',
                maxLength: fieldSize(field.Type)
              };
              break;

            case 'varbinary':
            case 'binary':
              property = {
                type: 'object',
                format: 'binary',
                maxLength: fieldSize(field.Type)
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

          if (field.Null == 'NO' && field.Key != 'PRI') schema.required.push(field.Field);

          return true;
        });

        if (done) cb(null, schema);
      }
    );

    db.release();
  });
};

module.exports = generateMySQLSchema;
