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
    
    this.documentClass = Document;
    
    this.autoIndexFields = {};
};

util.inherits(RiakModel, Model);

RiakModel.prototype.autoIndex = function riakModelAutoIndex(fieldName, transformer) {
    this.autoIndexFields[fieldName] = transformer || {};
};

RiakModel.prototype.performAutoIndex = function riakModelPerformAutoIndex(document) {
    if (!('index' in document.meta)) {
        document.meta.index = {};
    }
    
    Object.keys(this.autoIndexFields).forEach(function(fieldName) {
        var transformer = this.autoIndexFields[fieldName];
        
        if (typeof transformer === 'function') {
            document.meta.index[fieldName] = transformer(document.getFieldValue(fieldName));
        } else {
            document.meta.index[fieldName] = document.getFieldValue(fieldName);
        }
    }, this);
}

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