# Using the RethinkDB driver

RethinkDB's functionality maps very well to Osmos's design, thus making the corresponding driver very easy to use. In fact, the RethinkDB driver does not require any specialized `Model` or `Document` subclasses:

```javascript
var Osmos = require('../../lib');
var Schema = Osmos.Schema;
var Model = Osmos.Model;

var RethinkDB = Osmos.drivers.RethinkDB;
var r = require('rethinkdb');

var schema = new Schema({
    name : String,
    email : String,
    id: [String, Schema.configurators.primaryKey]
});

r.connect(
    {
        host: 'localhost',
        port: 28015,
        db: 'osmos'
    },
    function(err, connection) {
        var db = new RethinkDB(connection);
        Osmos.registerDriverInstance('rethinkDB', db);

        model = new Model('TestModel', schema, 'person', 'rethinkDB');
        
        model.create(function(err, doc) {
            doc.name = 'Marco';
            doc.email = 'marcot@tabini.ca';
            
            doc.primaryKey = 'marco';
            
            doc.save(function(err) {
                expect(err).to.be.null;
                
                expect(doc.primaryKey).to.equal('marco');
                
                done();
            });
        });
    }
);
```

## Primary keys

The driver **requires** a primary key to be set, or you won't be able to do much (although you might get away with just inserting data, without reading).

You can either set a primary key explicitly (either by assigning a value to a document's `primaryKey` property, or to the corresponding field directly), or let the database cluster assign one by leaving the primary key empty.

## Atomic updates

Updates to an existing object are performed using the [`update`](http://www.rethinkdb.com/api/#js:writing_data-update) method of the RethinkDB module in atomic mode, writing only those fields that have been modified since the last time a document was created.

This means that you can perform multiple updates in parallel without having to worry about inadvertently causing a loss of data by overwriting values you didn't mean to.

## Complex find operations

By default, a call to `find` or `findAll` expects a hash that contains like this:

```javascript
{
    search: 'The value to search for',
    index: 'The name of the index or indices to search on'
}
```

To account for the fact that RethinkDB's ReQL supports a much richer set of functionality, the find methods will also accept a closure, which receives a reference to the connection and table to use for the search, and is expected to call a callback, providing either a single raw document hash (if using `findOne()`) or an array of hashes (if using `find()`). For example:

```javascript
model.find(
    function(connection, table, callback) {
        table.getAll('marcot@tabini.ca', { index : 'email' }).run(connection, function(err, cursor) {
            if (err) return callback(err);
            
            cursor.toArray(callback);
        });
    },
    
    function(err, result) {
        expect(err).to.be.null;

        expect(result).to.be.an('array');
        
        result.forEach(function(doc) {
            expect(doc.email).to.equal('marcot@tabini.ca');
        });

        done();
    }
);
```