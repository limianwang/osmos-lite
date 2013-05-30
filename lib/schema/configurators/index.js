module.exports = {
    
    Configurator : require('./configurator'),
    
    configurators : {
        primaryKey : require('./primarykey'),
        optional : require('./optional'),
        alias : require('./alias'),
    }
    
};