var r = require('rethinkdb');
var objectDiff = require('objectdiff');

var Error = require('../util/error');

var Driver = function OsmosRethinkDriver(connection, options) {
    this.connection = connection;
    this.options = options || {};
}

Driver.prototype = {
    
    create : function create(bucket, callback) {
        callback(null, {});
    },
    
    get : function get(bucket, key, callback) {
        r.table(bucket, this.options).get(key).run(this.connection, callback);
    },
    
    post : function post(bucket, document, data, callback) {
        r
            .table(bucket, this.options)
            .insert(data)
            .run(this.connection, function(err, result) {
                if (err) return callback(err);
                if (result.errors) return callback(new Error('Database insertion error: ' + JSON.stringify(result.first_error)));
                
                if (result.generated_keys) {
                    document.primaryKey = result.generated_keys[0];
                }
            
                callback(null);
            });
    },
    
    put : function put(bucket, document, data, callback) {
        if (!document.schema.primaryKey || !document.primaryKey) {
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
        
        r
            .table(bucket, this.options)
            .get(primaryKey)
            .update(diff)
            .run(this.connection, function(err, result) {
                if (err) return callback(err);
                if (result.errors) return callback(new Error('Database update error: ' + JSON.stringify(result.first_error)));
                
                if (diff[document.schema.primaryKey]) {
                    document.primaryKey = document.schema.primaryKey; // In case the primary key has changed.
                }
                
                callback(null);
            });
    },
    
    del : function deleteRecord(bucket, key, callback) {
        if (key.constructor.name === 'Object') {
            key = key[Object.keys(key)[0]];
        }

        r
            .table(bucket, this.options)
            .get(key)
            .delete()
            .run(this.connection, function(err, result) {
                if (err) return callback(err);
                if (result.errors) return callback(new Error('Database deletion error: ' + JSON.stringify(result.first_error)));
                
                callback(null);
            });
    },
    
    findOne : function findOne(bucket, spec, callback) {
        var table = r.table(bucket, this.options);
        
        if (typeof spec === 'function') {
            spec(this.connection, table, callback);
        } else {
            table.getAll(spec.search, { index : spec.index }).limit(1).run(this.connection, function(err, cursor) {
                if (err) return callback(err);
                
                cursor.toArray(function(err, docs) {
                    callback(err, docs.length ? docs[0] : null);
                });
            });
        }
    },
    
    find : function find(bucket, spec, callback) {
        var table = r.table(bucket, this.options);
        
        if (typeof spec === 'function') {
            spec(this.connection, table, callback);
        } else {
            table.getAll(spec.search, { index : spec.index }).run(this.connection, function(err, cursor) {
                if (err) return callback(err);
                
                cursor.toArray(function(err, docs) {
                    callback(err, docs);
                });
            });
        }
    },
    
};

module.exports = Driver;