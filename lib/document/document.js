'use strict';

var async = require('async');

var Document = function OsmosDocument(data, schema) {
  this.schema = schema;
};

Document.prototype.update = function(payload, cb) {
  if (this.model) return this.model._update(this, payload, cb);
  
  this._update(payload, cb);
};

Document.prototype._update = function(payload, cb) {
  var updateableProperties;
  
  if ('updateableProperties' in this) {
    updateableProperties = this.updateableProperties;
  }
  
  if (!updateableProperties && this.model) updateableProperties = this.model.updateablePropertiesHash;
  
  if (!updateableProperties) throw new Error('Update called on a document whose model has no updateable properties. See the docs for updateableProperties for more information.');
  if (updateableProperties.constructor.name != 'Object') return cb(new Error('Invalid data payload.', 400));
  
  var self = this;
  
  async.each(
    Object.keys(updateableProperties),
    
    function(key, cb) {
      if (payload.hasOwnProperty(key)) {
        self[key] = payload[key];
      }
      
      cb(null);
    },
    
    cb
  );
};

module.exports = Document;
