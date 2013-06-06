var Model = function OsmosSimpleModel(data) {
    this.driver = Model.driver;
    this.data = data || {};
    this.primaryKey = data._primaryKey;
    this.constructor = Model;
};

Model.driver = null;

Model.get = function get(id, callback) {
    Model.driver.get(null, id, function(err, result) {
        callback(err, result ? new Model(result) : null);
    });
};

Model.find = function find(spec, callback) {
    Model.driver.find(null, spec, function(err, result) {
        var models = [];

        if (result && result.forEach) {            
            result.forEach(function(record) {
                models.push(new Model(record));
            });
        }
        
        callback(err, models);
    });
};

Model.findOne = function findOne(spec, callback) {
    Model.driver.findOne(null, spec, function(err, result) {
        callback(err, result ? new Model(result) : null);
    });
};

Model.delete = function deleteRecord(id, callback) {
    Model.driver.delete(null, { _primaryKey : id }, callback);
};

Model.prototype = {
    
    get primaryKey() {
        return this.data.id;
    },
    
    set primaryKey(value) {
        this.data.id = value;
    },
    
    get id() {
        return this.data.id;
    },
    
    set id(value) {
        this.data.id = value;
    },
    
    get datum() {
        return this.data.datum;
    },
    
    set datum(value) {
        this.data.datum = value;
    },
    
    save: function save(callback) {
        if (this.id != undefined) {
            this.driver.put(null, this, this.toJSON(), callback);
        } else {
            this.driver.post(null, this, this.toJSON(), callback);
        }
    },
    
    toJSON : function toJSON() {
        return JSON.parse(JSON.stringify(this.data));
    },
    
}

module.exports = Model;