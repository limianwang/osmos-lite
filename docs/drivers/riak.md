# Using the Riak driver

The Riak driver uses the [riak-js](http://riak-js.org) library to connect to a supported Riak cluster. In addition to the basic CRUD operations provided by Osmos, the driver also includes access to Riak's metadata store and map/reduce functionality, in addition to supporting automatic secondary indexing on arbitrary fields.

## Basic operation

The basic operation of the driver is not very dissimilar from any other driver. On instantiation, the Riak driver takes a set of configuration parameters that are passed directly to the underlying riak-js module, which means that everything that the latter supports, including automatic client-side load balancing, is also supported by Osmos. For example:

```javascript
var Osmos = require('../../lib');
var Schema = Osmos.Schema;
var Riak = Osmos.drivers.Riak;

var schema = new Schema({
    name : String,
    email : String
});

var db = new Riak({
    host: 'localhost',
    port: 8087
});

Osmos.registerDriverInstance('riak', db);

model = new Riak.Model(schema, 'users', 'riak');

```

Note that the Riak driver uses a special subclass of `Model` that is provided by the driver itself. This incorporates the underlying Riak functionality and should be used throughout your code whenever you use Riak.

## Meta

Osmos Riak documents provide an extra field called `meta` that provides access to the metadata associated with the document. The meta object functions in a similar way to an Osmos document: if you attempt to read a value from it that doesn't yet exist, the document will throw an error. (You can, however, use the `in` operator to check whether a field exists.)

## Keys

The unique key associated with an object is available as part of the meta, and is also mapped to the document's `primaryKey` read/write property. You can set the key as needed, or leave it blank to perform a `POST` operation and retrieve it on return.

## Autoindexing

Riak documents are capable of automatically creating and updating secondary indices based on arbitrary fields. All you have to do is to simply set up the autoindexing feature on the corresponding model:

```javascript
// Assume the model has been instantiated elsewhere

model.autoindex('name');
model.autoindex('email', function(x) { return x.toLowerCase() });
```

Whenever a document is saved, Osmos will now automatically create secondary indices for the `name` and `email` fields. You can also specify a transformer function, which will be called with the field's value before the secondary index is created.

## Search operations

Riak models do not support the `findOne` method, since the underlying data store is incapable of returning only one object. The `find` method can, however, be used to perform 2i searches and have the corresponding documents automatically fetched; the query is passed directly to riak-js and should, therefore, follow the library's accepted format. For example:

```javascript
model.query(
    {
        country: 'CA',
        province: 'ON'
    },
    function(err, docs) {
        // Docs will be an array of Osmos documents
    }
);
```

## Map/Reduce

M/R operations are fully supported: A Riak model exposes a `mapReduce` property that can be used to initiate a new map/reduce job, which is represented by a special `RiakMapper` object; the syntax used is essentially identical to what the underlying riak-js library offers:

```javascript
model.mapReduce
    .add({ bucket : 'users3' })
    .map('Riak.mapValuesJson')
    .map(function(value) {
        var res = {};
        
        res[value.email] = 1;
        
        return res;
    })
    .reduce(function(values) {
        var result = {};

        values.forEach(function(values) {
            Object.keys(values).forEach(function(value) {
                if (value in result) {
                    result[value] += values[value];
                } else {
                    result[value] = values[value];
                }
            });
        });

        return [ result ];
    })
    .run(function(err, results) {
        expect(err).to.be.null;
        
        expect(results).to.be.an('array');
        expect(results).to.have.length(1);
        
        expect(Object.keys(results[0])).to.have.length(3);
        
        callback();
    });
```

Since the result of a M/R operation can be essentially anything, Osmos doesn't automatically attempt to map it to an array of documents. If you know that this is possible because the results of your job are properly structured, you can use the `wrap()` method to force Osmos to perform the mapping:

```javascript
model.mapReduce
    .add({ bucket : 'users3' })
    .map('Riak.mapValuesJson')
    .wrap
    .run(function(err, results) {
        // On success results will be an array of documents.
    });
```