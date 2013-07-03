var redis = require('redis');

var Error = require('../../error');

var util = require('util');
var async = require('async');

var Driver = function OsmosRedisDriver(/*...*/) {
    this.constructor = require('../driver');
    
    var port, host, password, config, callback;
    
    switch(arguments.length) {
        case 2:
            // client, callback
            
            this.client = arguments[0];
            return arguments[1](null);
            
            break;
            
        case 3:
            // port, host, callback

            port = arguments[0];
            host = arguments[1];
            callback = arguments[2];
            
            break;
            
        case 4:
            // port, host, password|config, callback

            port = arguments[0];
            host = arguments[1];
            
            if (typeof arguments[2] === 'string') {
                password = arguments[2];
            } else {
                config = arguments[2];
            }
            
            callback = arguments[3];
            
            break;
            
        case 5:
            // port, host, password, config, callback
            
            port = arguments[0];
            host = arguments[1];
            password = arguments[2];
            config = arguments[3];
            callback = arguments[4];
            
            break;
    }
    
    this.client = redis.createClient(port, host, config);
    
    if (password) {
        this.client.auth(password);
    }
    
    this.client.on('ready', callback);
}

Driver.prototype = {
    
    bucketize: function bucketize(bucket, key) {
        return bucket ? bucket + '-' + key : key;
    },
    
    debucketize: function debucketize(bucket, key) {
        return bucket ? key.replace('^' + bucket + '-', '') : key;
    },
    
    create : function create(bucket, callback) {
        callback(null, {
            object: {},
            key: null
        });
    },
    
    get : function get(bucket, key, callback) {
        var actualKey = this.bucketize(bucket, key);
        
        this.client.hgetall(actualKey, function(err, hash) {
            callback(err, hash ? {
                object: hash,
                key: key
            } : null);
        });
    },
    
    post : function post(bucket, document, data, callback) {
        throw new Error('You cannot save a document to Redis without setting a primary Key');
    },
    
    put : function put(bucket, document, data, callback) {
        key = this.bucketize(bucket, document.primaryKey);
        
        this.client.hmset(key, data, callback);
    },
    
    delete : function deleteDocument(bucket, key, callback) {
        this.client.del(this.bucketize(bucket, key), callback);
    },
    
    findOne : function findOne(bucket, spec, callback) {
        throw new Error('Searches are not supported by the Redis driver');
    },
    
    find : function find(bucket, spec, callback) {
        throw new Error('Searches are not supported by the Redis driver');
    },
    
    hincrby : function hincrby(bucket, key, fieldName, increment, callback) {
        this.client.hincrby(this.bucketize(bucket, key), fieldName, increment, callback);
    },
    
};

Driver.Model = require('./model');
Driver.Document = require('./document');

module.exports = Driver;