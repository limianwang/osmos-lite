var Error = require('../../error');
var Model = require('../../model');

var Document = require('./document');

var util = require('util');

var Mapper = function RiakMapper(model) {
    this.model = model;
    this.mapreduce = model.db.client.mapreduce;
    this.wrap = false;
};

Mapper.prototype = {
    add : function add(spec) {
        this.mapreduce = this.mapreduce.add(spec);
        
        return this;
    },
    
    map : function map(spec) {
        this.mapreduce = this.mapreduce.map(spec);
        
        return this;
    },
    
    reduce : function reduce(spec) {
        this.mapreduce = this.mapreduce.reduce(spec);
        
        return this;
    },
    
    wrap : function wrap() {
        this.wrap = true;
        
        return this;
    },
    
    run : function run(callback) {
        this.mapreduce.run(function(err, results) {
            if (err) return callback(err);
            
            if (this.wrap) {
                results = results.map(function(element) {
                    return new Document(element);
                });
            }
            
            callback(err, results);
        });
        
        return this;
    }
};

var RiakModel = function RiakModel(schema, bucket, db) {
    Model.call(this, schema, bucket, db);
    
    this.hook('willCreate', function(payload, callback) {
        payload.documentClass = Document;
        
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
};

util.inherits(RiakModel, Model);

Object.defineProperty(
    RiakModel.prototype,
    'mapReduce',
    {
        enumerable : true,
        configurable: true,
        
        get: function() {
            return new Mapper(this);
        }
    }
);

module.exports = RiakModel;