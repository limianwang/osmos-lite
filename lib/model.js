var expect = require('./util/expect');
var Document = require('./document');

var Model = function OsmosModel(schema, bucket, db) {
    this.schema = schema;
    this.bucket = bucket;
    this.db = typeof db === 'string' ? require('./index').getDriverInstance(db) : db;
    
    expect(schema.constructor.name).to.equal('OsmosSchema');
    expect(db.constructor.name).to.equal('OsmosDriver');
};

Model.prototype = {
    
    create : function createDocument(callback) {
        var _this = this;
        
        this.db.create(this.bucket, function(err, data) {
            if (err) return callback(err);
            if (data) return callback(null, new Document(_this, data));
            
            callback();
        });
    },
    
    get : function getDocument(primaryKeyValue, callback) {
        var _this = this;
        
        this.db.get(this.bucket, primaryKeyValue, function(err, data) {
            if (err) return callback(err);
            if (data) return callback(null, new Document(_this, data));

            callback();
        });
    },
    
    findOne : function findDocument(spec, callback) {
        var _this = this;
        
        this.db.findOne(this.bucket, spec, function(err, data) {
            if (err) return callback(err);
            if (data) {
                if (typeof data === 'array') {
                    data = data[0];
                }
                
                return callback(null, new Document(_this, data));
            }
            
            callback();
        });
    },
    
    find : function findDocuments(spec, callback) {
        var _this = this;
        
        this.db.find(this.bucket, spec, function(err, data) {
            if (err) return callback(err);
            if (data) {
                if (typeof data !== 'array') {
                    data = [ data ];
                }
                
                var result = [];
                
                data.forEach(function(data) {
                    result.push(new Document(this, data));
                }, this);
                
                callback(null, result);
            }
        });
    },
    
    delete : function deleteDocuments(spec, callback) {
        this.db.delete(this.bucket, spec, callback);
    }
    
};

module.exports = Model;