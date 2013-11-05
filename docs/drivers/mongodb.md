# Using the MongoDB driver

MongoDB maps relatively well to Osmos; therefore, with some important caveats, using the two together should be easy and worry-free.

```javascript
var Osmos = require('../../lib');
var Schema = Osmos.Schema;
var Model = Osmos.Model;

var MongoDB = Osmos.drivers.MongoDB;
var mongo = require('mongodb');

var schema = new Schema('https://example.org/tokens', {
  id: 'https://example.org/tokens',
  $schema: 'http://json-schema.org/draft-04/schema#',

  title: 'Token Object',
  description: 'Token Object',

  type: 'object',

  required: ['account', ],

  properties: {

    _id: {
      type: 'string',
      description: 'Token ID',
    },
    name: {
      type: 'string',
      description: 'The Account name'
    }
  
  }
);

schema.primaryKey = '_id';

mongo.MongoClient.connect(url, options || {}, function(err, db) {
  if (err) cb(err);
  
  var db = new RethinkDB(connection);

  Osmos.drivers.register('rethinkDB', db);

  model = new Model('TestModel', schema, 'person', 'rethinkDB');
  
  model.create(function(err, doc) {
      doc.name = 'Marco';
      doc.primaryKey = 'marco';
      
      doc.save(function(err) {
          expect(err).to.be.null;
          
          expect(doc.primaryKey).to.equal('marco');
          
          done();
      });
  });
});
```

## Primary keys

The driver **requires** a primary key to be set to `_id`. Note that, while you can use anything that MongoDB allows as a primary key, `ObjectId` instances will automatically be marshaled from/to strings for you by the driver.

## Atomic updates

Updates to an existing object are performed using the `update` method of the MongoDB module in atomic mode, writing only those fields that have been modified since the last time a document was created.

This means that you can perform multiple updates in parallel without having to worry about inadvertently causing a loss of data by overwriting values you didn't mean to.

Note that, however, the driver doesn't know or understand atomic update operators, like `$inc`. You will need to run those directly against the underlying MongoDB driver.

