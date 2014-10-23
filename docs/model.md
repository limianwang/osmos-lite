# Models

A schema represents the blueprint for a document. It brings together a schema, which describes the document's structure, and a driver, which provides a direct interface to a data store.

## Model basics

    var Osmos = require('osmos');
    var Schema = Osmos.Schema;

    Osmos.registerDriverInstance('db', new Osmos.drivers.memory());

    var schema = new Schema({
      // Define your schema here
    });

    var model = new Model('UserName', schema, 'users', 'db');

    function callback(err, document) {
        // Do something with the document
    }

    model.get('123123', callback); // By primary key
    model.findOne({ name : 'marco' }, callback); // Find one document
    model.find({ name : /^m.+/ }, callback); // Find all documents that match

    model.create(callback); // Create a new document

## Creating a model

To create a model, you must provide four components: a name, a schema, a bucket, and a data connection.

The meaning of “bucket” depends on the data store driver you're using, but, in general, it identifies a container of data that makes sense within the context of the driver—e.g.: a table in a RDBMS, bucket in a NoSQL solution like Riak, etc.

Data connections can be specified by providing the name of a connection you previously registered using `Osmos.drivers.register()`.

## Accessing existing documents

You can retrieve documents in three ways:

- `get(primaryKeyValue, function callback(err, doc))` retrieves a specific element by its primary key (obviously, the bucket must have a primary key, and the driver must know what it is).
- `findOne(spec, function callback(err, doc))` retrieves a specific element based on an arbitrary set of search specifications, the exact nature of which are dependent on the driver.
- `find(spec, function callback(err, docs))` retrieves one or more number of elements based on an arbitrary set of search specs—again, the nature of these depends on the individual driver. The results should be returned as an array-like object.

## Instantiating documents from hardcoded data

It may, on occasion, be convenient to simulate a data store retrieval operation using hardcoded data—for example, when retrieving multiple documents from a collection that is encapsulate by multiple models, or for other testing purposes.

Osmos supports this requirement by providing a `getFromImmediateData(data, callback(err, doc))` method that executes the same retrieval cycle as `get()` (including all hooks), but using pre-fetched data instead of reaching out to the data store:

```javascript
var data = {
  _id: 123123,
  name: 'Marco',
  email: 'marco@example.org'
};

model.getFromImmediateData(data, function(err, doc) {
  // Do something here.
});
```

## Creating new documents

To create a new document, you can use the `create` method, which returns a completely empty document:

    Model.create(function(err, doc) {});

## Deleting one or more documents

To delete one or more documents, you can use the `delete` method:

    Model.delete(spec, function callback(err, count));

On a successful return, `count` should contain the number of rows affected by the deletion operation.

## Get-or-create functionality

Starting with version 1.2.0, the Model class provides a `getOrCreate` method that allows you to fetch an existing document or create a new one if the document with the given primary key doesn't exist:

```javascript
var doc = model.getOrCreate(function(err, doc, created) {
  // created indicates whether the document existed and was fetched from
  // the data store (false) or whether it was created (true).
});
```

Note that `getOrCreate()` automatically prepopulates the primary key in a newly-created document.

## Counting number of documents

To get a count of documents, you can use the `count` method:

    Model.count(spec, function(err, count) {});

## Class methods

Models essentially act like class factories, and you can add class methods to a model after it has been created. For example:

```javascript
var Osmos = require('osmos-odm');

var schema = new Osmos.Schema(
// Define your schema here
);

schema.primaryKey = 'id';

var model = new Osmos.Model(
  'myResource',
  schema,
  'meterTable',
  'meterTableDataSource'
);

model.findByUser = function findResourcesByUser(user, resourceId, resourceType, cb) {
  // Perform work here.
}
```

The methods you define this way can then be called directly on the model object.

## Transformers

A transformer modifies the raw data stored in the backing store before passing it back and forth to your JavaScript documents. For example, if your data store uses a special data format (like Mongo's `ObjectID`), you can use a transformer to render it as a string and then convert it back to its native format before committing it back to the store:

A transformer consists of a pair of methods used to retrieve or set values:

```javascript
model.transformers['authToken.expires'] = {
  set: function(value) {
    throw new Error('Auth token expiry dates cannot be set directly.');
  },

  get: function(value) {
    return new Date(value);
  }
};
```

Transformers are added to the `transformers` hash of a model, using the fully qualified name of the property they relate to (including the name of the model itself). The example above will apply to the `expires` property of documents created from the `authToken` model.

**As of version 1.0.3,** adding transformers to a model is deprecated. Add them instead to the schema (where it makes sense from an architectural perspective).

## Document instance methods

Since you do not instantiate documents directly, you must also define document instance methods and dynamic properties through the model. This is explained in the documents section of the docs.

## Hooks

Models expose a number of hooks, which can be used to intercept certain operations as they are performed on individual documents. In general, hooks are called asynchronously. For example, you can use `didCreate` to prime a new document with some basic data:

```javascript
model.hook('didCreate', function(doc, cb) {
  doc.__raw__.token = crypto.createHash('sha256').update(String(new Date().getTime()) + Math.random()).digest('hex');
  doc.__raw__.expires = Number.MAX_VALUE;

  cb(null);
});
```

Or you can use the `didSave` hook to cascade a series of updates to various interrelated documents:

```javascript
model.hook('didSave', function(args, cb) {
  var doc = args.doc;

  // Do something here

  cb(null);
});
```

The following hooks are available:

- `didCreate` receives a reference to a newly create document
- `willFind` and `didFind` receive a hash that contains a reference to the `spec` that constitutes the search operation and a `stop` parameter that can be used to prevent the search operation from completing
- Similarly, `willFindOne` and `didFindOne` receive a hash that contains a reference to the `spec` that constitutes the search operation and a `stop` parameter that can be used to prevent the search operation from completing
- `willGet` receives a hash that contains a reference to the primary key of the document being retrieved, and a `stop` parameter that can be used to prevent the search operation from completing
- `didGet`  receive a hash with a reference to the document being saved and a `stop` parameter that can be used to prevent the save operation from completing
- `willInitialize` and `didInitialize` are called before instantiating a new document object and receive a hash with the raw data and the constructor of the underlying document class
- `willSave` and `didSave` receive a hash with a reference to the document being saved and a `stop` parameter that can be used to prevent the save operation from completing
- `willDelete` and `didDelete` also receive a hash with a reference to the document being saved and a `stop` parameter that can be used to prevent the save operation from completing
- `willUpdate` and `didUpdate` receive a hash that contains a reference to the document being updated, a reference to the updates being applied, and a `stop` parameter that can be used to prevent the update operation from completing

