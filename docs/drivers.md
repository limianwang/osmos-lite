# Osmos driver specification

A driver is simply an object that is used to perform low-level—at least, as far as Osmos is concerned—operations against a data store. Osmos does not attempt to abstract the data layer away completely; for example, find operations pass all parameters directly to the corresponding methods in the driver, thus allowing the format to be whatever it needs to be (e.g.: SQL, hash, etc.).

All driver methods are designed to be asynchronous and should expect a callback, which follows Node's traditional signature `(err, result)` as the last parameter passed to them. It is the driver's responsibility to notify the callback when an operation is complete.

## Handling primary keys

Osmos does not support multiple primary keys. Only one key is allowed, although the driver is free to hide the complexity of multiple keys from the ODM, for example by combining them into a single value.

It is the driver's responsibility to fill the appropriate primary key by setting the `primaryKey` on the model before returning from a call to `put`. To not do so should be considered a programmer error.

## Handling relationships

Because Osmos is not an ORM, and because it is primarily aimed at unstructured data stores, it doesn't concern itself with relationships, although drivers are free to implement them transparently to the ODM layer (for example, by refusing to fulfill a request if it violates a relationship, and so forth).

Similarly, Osmos doesn't understand the concept of a “reference,” although driver implementers are free to implement it through a special type.

## Reporting errors

Drivers should only report errors that represent either programmer error or external events (e.g.: network failures, authentication errors, etc.). In particular, “record not found” errors should not be reported; the ODM layer will automatically detect their presence based on the lack of results. In other words, return errors if and only if you want to push the big red panic button because something catastrophic has happened.

## Methods

Drivers should be simple interfaces to the data layer; as such, they only need to implement a handful of methods, which should be available in just about any database.

### Initialization

The initialization of a driver is considered an implementation detail. Since Osmos doesn't abstract the data store itself (that is, we expect users of Osmos to _know_ that they are coding against a specific database), there is no prescribed initialization mechanism.

### CRUD

Crud operations follow the REST model, and use names patterned after the corresponding HTTP verb:

- `get(primaryKey, callback)`
- `post(model, callback)`
- `put(model, callback)`
- `delete(primaryKey, callback)`

### Search

Search operations are used when the end developer invokes `findOne()` or `find()` on a model. Because the search mechanism is likely to vary greatly between data stores (and even between different search mechanism inside a data store), the `spec` parameter is passed as-is from the model:

- `find(spec, callback)`
- `findOne(spec, callback)`

Note that the difference between `find` and `findOne` is dependent on the individual data store, and indicates the end developer's intention only in that context. For example, on dat stores that support versioning or conflict resolution, like Riak, it is acceptable for `findOne()` to return more than one version of the same document (Osmos expect the end developer to be aware of this fact.)

### Result format

Drivers should not concern themselves with creating instances of a model when they retrieve objects from the data store. Instead, they should pass the raw data collected to the callback in the form of a hash (or an array of hashes), which will then worry about instantiating and populating the individual models.
