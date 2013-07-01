# Osmos: a store-agnostic object data mapper for Node.js

Osmos is a object data mapper (ODM) designed to bridge Node.js apps with any data store that support traditional CRUD operations. It's built on three principles:

- **Stay out of the way.** Osmos is intuitive and largely transparent to developers, and, most of all, doesn't attempt to be “smarter” than its human masters. It can also be easily mocked away for testing without having to write specialized code.

- **Fail early, and fail loudly.** Osmos uses Harmony Proxies to trap writes to a document; if attempts are made to read or write non-existent fields, an error is immediately throw to help you and pinpoint mistakes before they end up in production.

- **Don't replace developer knowledge.** Osmos is designed to be a generic ODM that will work well with just about any data store that supports CRUD operations. However, it is _not_ meant to be an abstraction layer; instead, it assumes that developers know best, and provides only a simple interface that can be easily extended through plugins.

## Installation

```
npm install osmos-odm
```

## Example:

```javascript
var Osmos = require('osmos-odm');
var Driver = Osmos.drivers.Riak;
var Schema = Osmos.Schema;
var Model = Osmos.Model;
var configurators = Osmos.configurators;

// Register a Riak driver instance

Osmos.registerDriverInstance(
    'db',
    new Driver({ host : 'riak.example.com', port: 8087 });
);

// Define a schema for our documents

var schema = new Schema({
    name: String,
    email: [String, configurators.optional]
});

// Create a model to bridge a schema with a driver 
// instance and data bucket

var model = new Model(schema, 'users', 'db');

// Create a new record

model.create(function(err, doc) {
    if (err) {
        // Handle errors
    }
    
    doc.name = 'Marco';
    
    // doc.email is optional, so we can just ignore it
    
    doc.save(function(err) {
        if (err) {
            // Handle errors
        }
    });
});
```
