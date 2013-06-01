# Models

A schema represents the blueprint for a document. It brings together a schema, which describes the document's structure, and a driver, which provides a direct interface to a data store.

## Model basics

    var Osmos = require('osmos');
    var Schema = Osmos.Schema;
    
    Osmos.registerDriverInstance('db', new Osmos.drivers.memory());

    var schema = new Schema({
        id : [ String , Schema.configurators.primaryKey ],
        name : String,
        phone : [ String , Schema.configurators.optional ]
    });
    
    var model = new Model(schema, 'users', 'db');
    
    function callback(err, document) {
        // Do something with the document
    }
    
    model.get('123123', callback); // By primary key
    model.findOne({ name : 'marco' }, callback); // Find one document
    model.find({ name : /^m.+/ }, callback); // Find all documents that match
    
    var document = model.create(); // Create a new document
    
## Creating a model

To create a model, you must provide three components: a schema, a bucket, and a data connection.

The meaning of “bucket” depends on the data store driver you're using, but, in general, it identifies a container of data that makes sense within the context of the driver—e.g.: a table in a RDBMS, bucket in a NoSQL solution like Riak, etc.

Data connections can be specified in two ways: either provide an actual driver instance, or provide the name of an instance you have previous registered with `Schema.registerDriverInstance`. The latter approach is preferable, because it makes it easier to mock connections for testing purposes.

## Accessing existing documents

You can retrieve documents in three ways:

- `get(primaryKeyValue, function callback(err, doc))` retrieves a specific element by its primary key (obviously, the bucket must have a primary key, and the driver must know what it is).
- `findOne(spec, function callback(err, doc))` retrieves a specific element based on an arbitrary set of search specifications, the exact nature of which are dependent on the driver.
- `find(spec, function callback(err, docs))` retrieves one or more number of elements based on an arbitrary set of search specs—again, the nature of these depends on the individual driver. The results should be returned as an array-like object.

## Creating new documents

To create a new document, you can use the `create` method, which returns a completely empty document:

    Model.create(function(err, doc) {});

## Deleting one or more documents

To delete one or more documents, you can use the `delete` method:

    Model.delete(spec, function callback(err, count));
    
On a successful return, `count` should contain the number of rows affected by the deletion operation.

