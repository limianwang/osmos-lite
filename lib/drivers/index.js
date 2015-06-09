'use strict';

var drivers = {};

module.exports = {
  Memory: require('./memory'),

  register: function registerDriverInstance(name, driver) {
    drivers[name] = driver;
  },

  instance: function getDriverInstance(name) {
    if (!drivers[name]) {
      throw new Error('Unknown driver instance ' + name);
    }

    return drivers[name];
  }
};
