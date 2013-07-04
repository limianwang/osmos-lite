var Document = require('./document');
var Hookable = require('./hookable');

var expect = require('./util/expect');
var util = require('util');

var hooks = [
    'willCreate',
    'didCreate',
    'willGet',
    'didGet',
    'willFindOne',
    'didFindOne',
    'willFind',
    'didFind',
    'willDelete',
    'didDelete'
];

var Model = function OsmosModel(schema, bucket, db) {
    this.schema = schema;
    this.bucket = bucket;
    this.db = (typeof db === 'string') ? require('./index').getDriverInstance(db) : db;
    
    this.constructor = OsmosModel;
    
    this.documentInitializer = null;
    this.documentMethods = {};
    this.documentProperties = {};
    
    this.documentClass = Document;
    
    expect(schema.constructor.name).to.equal('OsmosSchema');
    expect(this.db.constructor.name).to.equal('OsmosDriver');
    
    Hookable.apply(this);
    
    hooks.forEach(function(hook) {
        this.registerHook(hook);
    }, this);
};

util.inherits(Model, Hookable);

Model.prototype.plugin = function plugin(callback) {
    callback(this);
};

Model.prototype.create = function createDocument(callback) {
    var hookPayload = {
        model: this,
        error : null,
        documentClass : this.documentClass,
    };
    
    var _this = this;
    
    this.performHookCycle(
        'Create',
        
        hookPayload,
        
        function osmosModelCreateOperationCallback(callback) {
            if (hookPayload.error) {
                return callback(hookPayload.error);
            }
            
            _this.db.create(_this.bucket, function(err, data) {
                hookPayload.error = err;
                
                if (err) return callback(err);
                
                if (data) {
                    hookPayload.document = new hookPayload.documentClass(_this, data);
                }

                callback(err);
            });
        },
        
        function osmosModelCreateFinalCallback() {
            callback(hookPayload.error, hookPayload.document);
        }
    );
    
},

Model.prototype.get = function getDocument(primaryKeyValue, callback) {
    var _this = this;
    
    var hookPayload = {
        model: this,
        primaryKey : primaryKeyValue,
        error : null,
        documentClass : this.documentClass,
    };
    
    this.performHookCycle(
        'Get',
        
        hookPayload,
        
        function osmosModelGetOperationCallback(callback) {
            if (hookPayload.error) {
                return callback(hookPayload.error);
            }
            
            _this.db.get(this.bucket, hookPayload.primaryKey, function(err, data) {
                hookPayload.error = err;
            
                if (err) return callback(err);
                
                if (data) {
                    hookPayload.document = new hookPayload.documentClass(_this, data);
                }

                callback(err);
            });
        }.bind(this),
        
        function osmosModelGetFinalCallback() {
            callback(hookPayload.error, hookPayload.document);
        }
    );
    
},

Model.prototype.findOne = function findDocument(spec, callback) {
    var _this = this;
    
    var hookPayload = {
        model: this,
        spec: spec,
        error: null,
        documentClass : this.documentClass,
    };
    
    this.performHookCycle(
        'FindOne',
        
        hookPayload,
        
        function osmosModelFindOneOperationCallback(callback) {
            if (hookPayload.error) {
                return callback(hookPayload.error);
            }
            
            _this.db.findOne(_this.bucket, hookPayload.spec, function(err, data) {
                hookPayload.error = err;
                
                if (err) return callback(err);
                
                if (data) {
                    if (typeof data === 'array') {
                        data = data[0];
                    }
                    
                    hookPayload.document = new hookPayload.documentClass(_this, data);
                }
        
                callback(err);
            });
        },
        
        function osmosModelFindOneFinalCallback() {
            callback(hookPayload.error, hookPayload.document);
        }
    );
    
},

Model.prototype.find = function findDocuments(spec, callback) {
    var _this = this;
    
    var hookPayload = {
        model : this,
        spec: spec,
        error: null,
        documentClass : this.documentClass,
    };
    
    this.performHookCycle(
        'Find', 

        hookPayload,
        
        function osmosModelFindOperationCallback(callback) {
            if (hookPayload.error) {
                return callback(hookPayload.error);
            }
            
            _this.db.find(_this.bucket, hookPayload.spec, function(err, data) {
                hookPayload.error = err;
                
                if (err) return callback(err);
                
                var docs = [];
                
                if (data) {
                    data.forEach(function(data) {
                        docs.push(new hookPayload.documentClass(_this, data));
                    }, _this);
                }
                
                hookPayload.documents = docs;
        
                callback(err);
            });
        },
        
        function osmosModelFindOneFinalCallback() {
            callback(hookPayload.error, hookPayload.documents);
        }
    );
}

Model.prototype.delete = function deleteDocuments(spec, callback) {
    var hookPayload = {
        model: this,
        spec: spec,
        error: null,
        count: 0
    };
    
    var _this = this;
    
    this.performHookCycle(
        'Delete',
        
        hookPayload,
        
        function osmosModelDeleteOperationCallback(callback) {
            if (hookPayload.error) {
                return callback(hookPayload.error);
            }
            
            _this.db.delete(_this.bucket, hookPayload.spec, function(err, count) {
                hookPayload.error = err;
                hookPayload.count = count || 0;
                
                callback(err);
            });
        },
        
        function osmosModelDelete() {
            callback(hookPayload.error, hookPayload.count);
        }
    );
}

module.exports = Model;