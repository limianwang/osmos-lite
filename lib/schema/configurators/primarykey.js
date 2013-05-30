function primaryKey(field, callback) {
    field.primaryKey = true;
}

primaryKey.constructor = require('./configurator');

module.exports = primaryKey;