# Using the MySQL driver

Osmos's MySQL driver maps the contents of a MySQL table or view to an Osmos document.

Since the schema is implicitly declared in the table itself, the driver can be used to actually generate a schema directly from the database, based on the current definition of a given view or table:

```javascript
var async = require('async');

var Osmos = require('../../lib');
var Schema = Osmos.Schema;
var Model = Osmos.Model;

var MySQL = Osmos.drivers.MySQL;

// Create a MySQL connection pool
// 
var pool = MySQL.createPool('localhost', 'osmos', 'root', 'osmos');

driver = new MySQL(pool);

// Create a model for the table `sales`
driver.generateSchema('sales', function(err, result) {
  expect(err).not.to.be.ok;
  expect(result).to.be.an('object');

  schema = new Schema('mysql', result);

  schema.primaryKey = 'orderId';

  model = new Model('mysql', schema, 'sales', 'mysql');
});
```

## Limitations

The MySQL driver makes the important assumption that your table has a primary key that is expressed by a single column. A composite primary key is likely to result in errors.

The driver supports the majority of MySQL data types, with some exceptions (for example, geo fields are not supported). Support for some data types is also limited by the capabilities of the [underlying library](https://github.com/felixge/node-mysql).

## Initializing a driver instance

A MySQL driver instance requires a MySQL connection pool; the driver provides a convenience method, called `createPool()`, that makes it easier to generate the pool:

```javascript
var MySQL = Osmos.drivers.MySQL;

var driver = new MySQL(MySQL.createPool(host, database, username, password));
```

Note that no connections are initiated during the pool's creation. Therefore, you cannot tell whether a connection is working until you actually start interrogating the database.

## Generating a schema

The `generateSchema` method is capable of automatically generating a schema based on the current state of the database. This should be the preferred way to manage schemas for MySQL connections, because the “true” schema always resides in the database itself, and manually-generated schemas could get out of sync easily.

```javascript
driver.generateSchema(tableOrView, [columns], callback(err, schema) {
  var schema = new Osmos.Schema(tableOfView, schema);
  var model = new Osmos.Model(...);
});
```

As you can see, you can specify an optional `columns` array, which allows you to limit the schema only to a specific subset of the view or tables' columns. Note that you _must_ include the primary key in this array if you specify it.

## 