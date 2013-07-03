var Model = require('../../model');
var Document = require('./document');

var util = require('util');

var RedisModel = function RedisModel(schema, bucket, db) {
    Model.call(this, schema, bucket, db);
    
    this.hook('willCreate', function(payload, callback) {
        payload.documentClass = Document;
        
        callback();
    });
    
    this.hook('didCreate', function(payload, callback) {
        payload.document.__created = true;

        payload.document.hook('didSave', function(payload, callback) {
            if (!payload.error) {
                payload.document.__created = false;
            }
        
            callback();
        });
        
        callback();
    });
    
    this.hook('willGet', function(payload, callback) {
        payload.documentClass = Document;
        
        callback();
    });
    
    this.hook('willFind', function(payload, callback) {
        payload.documentClass = Document;
        
        callback();
    });
    
    this.autoIndexFields = {};
};

util.inherits(RedisModel, Model);

module.exports = RedisModel;