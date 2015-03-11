# Osmos Drivers

Drivers allow Osmos to interface with a specific data store. Because Osmos is store-agnostic, a driver only needs to support a limited number of operations that fit the mould of the typical [CRUD system](http://en.wikipedia.org/wiki/Create,_read,_update_and_delete).

Currently, Osmos 1.x supports the following data stores:

- [ElasticSearch](./elasticsearch.md)
- [Memory](./memory.md), a memory-based driver useful for testing purposes only.
- [MongoDB](./mongodb.md)
- [MySQL](./mysql.md)

## CRUD operations

Note that the signatures of these methods have changed as of version 1.1.0

A driver is a class that implements these methods:

- `create(model, cb)` 

  Creates a new document and pass it to the callback. The document should be a simple hash—`create`'s only job is to initialize any arbitrary values that are required by the specific data store.
  
- `get(model, key, cb)` 

  Retrieves a document from the store. A document-not-found error should be passed to the callback as `(null, null)`.
  
- `post(document, data, cb)` 

  Inserts a new document into the data store. The `data` represents the serialized document and, under most circumstances, can be inserted directly into the data store. 
  
  The `document` argument, which references the Osmos document that is requesting the insertion operation, is also passed along for convenience.
  
- `put(document, data, cb)`

  Like `post()`, but for a document that has already been saved in the past.
  
- `del(model, key, cb)`

  Deletes the document with the given key. Document-not-found errors should not result in errors being reported to the callback.
  
## Search operations

In addition to the basic crud operations, a driver should also support these methods:

- `findOne(model, query, cb)`

  Retrieves _any_ result that matches the given `query`, represented as a simple hash. There is no prescription as to what `query` should contain—the meaning is left as an implementation detail for the individual driver.
  
  A not-found error should be reported as `(null, null)`
  
- `find(model, spec, cb)`

  Retrieves _all_ results that match the given `query`, returning an array of all the documents that match the query, represented as simple hashes. A not-found error should be reported as `(null, [])`.
