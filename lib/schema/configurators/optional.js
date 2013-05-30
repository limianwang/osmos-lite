function optional(field, callback) {
    field.required = false;
}

optional.constructor = require('./configurator');

module.exports = optional;