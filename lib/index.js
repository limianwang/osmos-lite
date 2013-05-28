var Osmos = {
    
    Error : require('./error'),
    
    Hookable : require('./hookable'),
    
    drivers : require('./drivers'),
    
    Schema : require('./schema'),
    
};


Osmos._driverInstances = {};

Osmos.registerDriverInstance = function registerDriverInstance(name, instance) {
    Osmos._driverInstances[name] = instance;
};

Osmos.getDriverInstance = function getDriverInstance(name) {
    var result = Osmos._driverInstances[name];
    
    if (!result) {
        throw new Osmos.Error('Driver instance ' + name + ' not found.');
    }
    
    return result;
}


module.exports = Osmos;