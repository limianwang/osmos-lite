var Error = require('../error');
var crypto = require('crypto');
var Driver = function OsmosMemoryDriver() {
    this.data = {};
    this.constructor = Driver;
}

function matchSpec(target, spec) {
    return Object.keys(spec).every(function(key) {
        var value = spec[key];
        
        if (typeof value === 'number') {
            return Number(target[key]) === spec[key];
        } else {
            return String(target[key]).match(spec[key]);
        }
    });
}

Driver.prototype = {
    
    get : function get(primaryKey, callback) {
        if (this.data[primaryKey]) {
            callback(null, this.data[primaryKey]);
        } else {
            callback();
        }
    },
    
    post : function post(model, callback) {
        if (model.primaryKey) return callback(new Error('You cannot call post on an object that already has a primary key. Clone it first.'));
        
        var primaryKey = crypto.randomBytes(20).toString('hex');
        model.primaryKey = primaryKey;
        
        this.data[primaryKey] = model.toJSON();
        
        callback();
    },
    
    put : function put(model, callback) {
        var primaryKey = model.primaryKey;
        
        if (!this.data[primaryKey]) return callback(new Error('The primary key ' + primaryKey + ' does not correspond to any existing record.'));
                
        this.data[primaryKey] = model.toJSON();
        
        callback();
    },
    
    delete : function deleteRecord(primaryKey, callback) {
        if (!this.data[primaryKey]) return callback(new Error('The primary key ' + primaryKey + ' does not correspond to any existing record.'));
        
        delete this.data[primaryKey];
        
        callback();
    },
    
    findOne : function findOne(spec, callback) {
        var result = null;
        var _this = this;
        
        Object.keys(this.data).every(function(key) {
            var record = _this.data[key];
            
            if (matchSpec(record, spec)) {
                result = record;
                return false;
            }
            
            return true;
        });
        
        callback(null, result);
    },
    
    find : function find(spec, callback) {
        var result = [];
        
        Object.keys(this.data).forEach(function(key) {
            var record = this.data[key];
            
            if (matchSpec(record, spec)) {
                result.push(record);
            }
        }, this);
        
        callback(null, result);
    },
    
};

module.exports = Driver;