function osmosOptionalConfigurator(field, callback) {
    field.required = false;
}

osmosOptionalConfigurator.constructor = require('./configurator');

module.exports = osmosOptionalConfigurator;