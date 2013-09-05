var Error = require('../util/error');
var crypto = require('crypto');
var Driver = function OsmosMemoryDriver() {
    this.data = {};
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
    
    create : function create(bucket, callback) {
        callback(null, {});
    },
    
    get : function get(bucket, primaryKey, callback) {
        if (this.data[primaryKey]) {
            callback(null, this.data[primaryKey]);
        } else {
            callback(null);
        }
    },
    
    post : function post(bucket, document, data, callback) {
        if (document.primaryKey) return callback(new Error('You cannot call post on an object that already has a primary key. Clone it first.'));
        
        var primaryKey = crypto.randomBytes(20).toString('hex');
        
        document.primaryKey = primaryKey;
        data._primaryKey = primaryKey;
        
        this.data[primaryKey] = data;
        
        callback(null);
    },
    
    put : function put(bucket, document, data, callback) {
        var primaryKey = document.primaryKey;
        
        if (!this.data[primaryKey]) return callback(undefined, undefined);
                
        this.data[primaryKey] = data;
        
        callback(null);
    },
    
    delete : function deleteRecord(bucket, spec, callback) {
        var _this = this;
        
        this.find(bucket, spec, function(err, results) {
            if (err) return callback(err);
            
            results.forEach(function(result) {
                delete _this.data[result._primaryKey];
            }, _this);
        
            callback(null, results.length);
        });
    },
    
    findOne : function findOne(bucket, spec, callback) {
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
    
    find : function find(bucket, spec, callback) {
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