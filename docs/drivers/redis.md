# Using the Redis driver

The Redis driver uses the [node_redis](https://github.com/mranney/node_redis) library to connect to a Redis instance; it only supports mapping of documents to Redis hashes. Subdocuments and arrays are not supported by this driver.

## Basic operation

The basic operation of the driver is not very dissimilar from any other driver. On instantiation, the Redis driver's constructor exposes the following signatures:

```javascript

Osmos.drivers.Redis(db, callback);
Osmos.drivers.Redis(port, host, callback);
Osmos.drivers.Redis(port, host, password | config, callback);
Osmos.drivers.Redis(port, host, password, config, callback);

```

Here, `db` is a pre-existing instance of node_redis, `host` and `port` and connection parameters for the Redis instance, `password` is the auth token for the Redis instance, and `config` is a hash that is sent directly to node_redis on instantiation. The `callback` closure is called immediately if you pass `db`, or on `ready` under all other circumstances to give you a chance to be notified when a connection has been established. It only takes an error parameter.

Usage of the driver is otherwise essentially identical to all other drivers:

```javascript
var Osmos = require('../../lib');
var Schema = Osmos.Schema;
var Redis = Osmos.drivers.Redis;

var schema = new Schema({
    name : String,
    email : String,
    age : [ Number , Schema.configurators.optional ]
});

var db = new Redis(8059, localhost, function(err) {
    // Connected if err is null
});

Osmos.registerDriverInstance('redis', db);

model = new Redis.Model(schema, 'users', 'redis');

```

A few notes:

- The Redis driver maps the concept of “bucket,” which doesn't exist in Redis, to a convenience function that prefixes the bucket to the name of keys stored through the model. FOr example, the model above will create (and search for) keys that start with `users-`. The prefix is automatically added when the data is passed to Redis, and removed on retrieval. If you do not want this feature, you can disable it by passing `null` as your bucket, in which case keys will be stored as you specify them.

- Like several other drivers, the Redis driver has its own version of `Model` and `Document`, respectively accessible as `Osmos.drivers.Redis.Model` and `Osmos.drivers.Redis.Document`. The driver automatically instantiates its own document variants, and expects the developer to work with its model variant.

- Subdocuments and array fields are not supported by the driver, as there is no way to map them directly to Redis.

- The driver maps the Document object's `primaryKey` property to the key of the underlying Redis hash. Since Redis doesn't support real “create” operations, you are required to assign `primaryKey` a value before you can save a document.

## Atomic operations

The Redis Document object variant also implements the special `hincrby` method, which simply calls the corresponding Redis method. It can only be called if the document has a primary key and has been saved at least once before to the backing store:

```javascript
model.create(function(err, doc) {
    doc.name = 'Marco';
    doc.email = 'marcot@tabini.ca',
    doc.age = 10;
    doc.primaryKey = 'key3';
    
    doc.save(function(err) {
        expect(err).to.be.null;
        
        doc.hincrby('age', 10, function(err) {
            expect(err).to.be.null;
            
            expect(doc.age).to.equal(20);
            
            done();
        });
    });
});
```