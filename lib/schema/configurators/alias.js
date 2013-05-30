var expect = require('../../util/expect');

function aliasF(aliasName) {
    expect(aliasName).to.be.a('string');
    
    function alias(field, callback) {
        field.alias = aliasName;
    }
    
    alias.constructor = require('./configurator');
    
    return alias;
}


module.exports = aliasF;