var util = require('util');

var Error = require('../../error');
var RiakMeta = require('riak-js/lib/meta')

var Meta = function OsmosRiakMeta() {
    RiakMeta.apply(this, arguments);
    
    this.constructor = Meta;
};

util.inherits(Meta, RiakMeta);

Meta.prototype.toJSON = function metaToJSON() {
    return this;
};

Meta.prototype.inspect = function metaInspect() {
    return JSON.stringify(this);
};

module.exports = Meta;