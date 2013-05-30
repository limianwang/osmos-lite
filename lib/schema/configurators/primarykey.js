function osmosPrimaryKeyConfigurator(field, callback) {
    field.primaryKey = true;
}

osmosPrimaryKeyConfigurator.constructor = require('./configurator');

module.exports = osmosPrimaryKeyConfigurator;