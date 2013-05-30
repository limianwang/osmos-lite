var expect = require('../../util/expect');

function osmosAliasConfiguratorFunction(aliasName) {
    expect(aliasName).to.be.a('string');
    
    function osmosAliasConfigurator(field, callback) {
        field.alias = aliasName;
    }
    
    osmosAliasConfigurator.constructor = require('./configurator');
    
    return osmosAliasConfigurator;
}


module.exports = osmosAliasConfiguratorFunction;