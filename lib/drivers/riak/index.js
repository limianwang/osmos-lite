var riak = require('riak-js');

var Error = require('../../error');

var util = require('util');
var async = require('async');

var RiakMeta = require('./meta');

var Driver = function OsmosRiakDriver(config) {
    this.constructor = require('../driver');
    
    this.client = riak.getClient(config);
}

Driver.prototype = {
    
    create : function create(bucket, callback) {
        callback(
            null, 
            {
                object: {},
                meta: new RiakMeta({})
            });
    },
    
    get : function get(bucket, key, callback) {
        this.client.get(bucket, key, function(err, obj, meta) {
            return callback(
                err,
                {
                    object: obj,
                    meta: new RiakMeta(meta)
                });
        });
    },
    
    post : function post(bucket, document, data, callback) {
        this.client.save(bucket, null, data, document.meta.toJSON(), function(err, doc, meta) {
            document.meta = new RiakMeta(meta);
            
            callback(err);
        });
    },
    
    put : function put(bucket, document, data, callback) {
        if (!document.meta.key) {
            throw new Error('You cannot put a document without a key.');
        }
        
        this.client.save(bucket, document.meta.key, data, document.meta.toJSON(), function(err, doc, meta) {
            document.meta = new RiakMeta(meta);
            
            callback(err);
        });
    },
    
    delete : function deleteRecord(bucket, key, callback) {
        this.client.remove(bucket, key, callback);
    },
    
    findOne : function findOne(bucket, spec, callback) {
        throw new Error('findOne() is not supported by the Riak driver');
    },
    
    find : function find(bucket, spec, callback) {
        var _this = this;
        
        this.client.query(bucket, spec, function(err, keys) {
            if (err) return callback(err);
            
            async.map(
                keys,
            
                function mapper(key, callback) {
                    _this.client.get(bucket, key, function(err, obj, meta) {
                        return callback(
                            err,
                            {
                                object: obj,
                                meta: new RiakMeta(meta)
                            });
                    });
                },

                callback
            );
        });
    },
    
};

Driver.Meta = RiakMeta;
Driver.Document = require('./document');
Driver.Model = require('./model');

module.exports = Driver;