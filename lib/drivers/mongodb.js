var async = require('async');
var mongo = require('mongodb');
var objectDiff = require('objectdiff');

var ObjectID = mongo.ObjectID;

var Error = require('../util/error');


function mongoKey(key) {
    if (!key || key.constructor.name == 'ObjectID') return key;
    
    try {
        return ObjectID(key);
    } catch (e) {
        return key;
    }
}

var Driver = function OsmosMongoDriver(database) {
    this.database = database;
}

Driver.prototype = {
    
    create : function create(bucket, callback) {
        callback(null, {});
    },
    
    get : function get(bucket, key, callback) {
        this.database.collection(bucket).findOne(
            {
                _id: mongoKey(key)
            },

            function(err, doc) {
                if (err) return callback(err);
                
                if (doc) {
                    doc._id = doc._id.toHexString ? doc._id.toHexString() : doc._id;
                }
                
                callback(null, doc);
            }
        );
    },
    
    post : function post(bucket, document, data, callback) {
        data._id = mongoKey(data._id);
        
        this.database.collection(bucket).insert(data, function(err, docs) {
            if (err) return callback(err);
            
            document.primaryKey = docs[0]._id.toHexString ? docs[0]._id.toHexString() : docs[0]._id;
            
            callback();
        });
    },
    
    put : function put(bucket, document, data, callback) {
        if (!document.model.schema.primaryKey || !document.primaryKey) {
            throw new Error('You cannot put a document without a primary key');
        }
        
        if (document.__originalData__[document.model.schema.primaryKey] == undefined) {
            return this.post(bucket, document, data, callback);
        }

        var changes = objectDiff.diff(document.__originalData__, data);
        
        if (changes.changed === 'equal') return callback(null); // Nothing to update.
        
        var diff = {};
        
        Object.keys(changes.value).forEach(function(key) {
            if (changes.value[key].changed !== 'equal') {
                diff[key] = data[key];
            }
        });
        
        var primaryKey;
        
        if (diff[document.schema.primaryKey]) {
            primaryKey = document.__originalData__[document.schema.primaryKey];
        } else {
            primaryKey = document.primaryKey;
        }
        
        this.database.collection(bucket).update(
            {
                _id: mongoKey(primaryKey)
            },
            
            {
                $set: diff,
            },
            
            callback
        );
    },
    
    del : function deleteRecord(bucket, key, callback) {
        if (key.constructor.name === 'Object') {
            key = key[Object.keys(key)[0]];
        }

        this.database.collection(bucket).remove(
            {
                _id: mongoKey(key)
            },
            
            callback
        );
    },
    
    findOne : function findOne(bucket, spec, callback) {
        this.database.collection(bucket).findOne(spec, callback);
    },
    
    find : function find(bucket, spec, callback) {
        this.database.collection(bucket).find(spec, function(err, rs) {
            if (err) return callback(err);
            
            rs.toArray(callback);
        });
    },
    
    findLimit : function findLimit(bucket, spec, start, limit, callback) {
      var self = this;
      
      async.parallel(
        {
          count: function(cb) {
            self.database.collection(bucket).find(spec).count(cb);
          },
          docs: function(cb) {
            self.database.collection(bucket).find(spec).skip(start).limit(limit, function(err, rs) {
                if (err) return cb(err);
            
                rs.toArray(cb);
            });
          }
        },

        callback
      );
    }
    
};

module.exports = Driver;