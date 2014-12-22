# Using the ElasticSearch driver

Osmos's ElasticSearch driver, available starting with version 1.4.0, supports both basic crud and query operations.

## Instantiation

Upon instantiation, the ES driver must be given the name of an ES index. The bucket of the Osmos model is mapped to the ES document type.

## Primary keys

The driver **requires** a primary key of your choosing; it will be mapped to to ES's document ID when performing updates and inserts.

## Atomic updates

Updates to an existing object are performed using the `update` method of the ES module, writing only those fields that have been modified since the last time a document was created.

This means that you can perform multiple updates in parallel without having to worry about inadvertently causing a loss of data by overwriting values you didn't mean to.

Note that all writes are automatically executed using `quorum` consistency and `refresh` set to `true` to ensure immediate index updates.

## Search

The driver supports a full complement of search functions (`findOne()`, `find()`, and `findLimit()`). The `spec` parameter passed to the model methods should conform to the [query specifications of the API](http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/query-dsl.html). For example:

```javascript
model.findLimit({
  query: {
    match: {
      email: email
    }
  },
  sort: [
    {
      <key>: {
        order: 'desc'
      }
    }
  ]
},

2,

10,

function(err, result) {
  expect(err).not.to.be.ok;

  expect(result).to.be.an('object');

  expect(result.count).to.equal(10);
  expect(result.start).to.equal(2);
  expect(result.limit).to.equal(10);
  expect(result.docs).to.be.an('array');
  expect(result.docs.length).to.equal(8);

  cb(null);
});
```

## Version < 1.6

Prior to version 1.6.0, the Elastic search driver does not offer much flexibility to the developer. The following example would be able to query all docs related to `email` but does not provide the flexibility of being sorted as in version 1.6.

```javascript
model.findLimit({
  match: {
    email: email
  }
},

2,

10,

function(err, result) {
  expect(err).not.to.be.ok;

  expect(result).to.be.an('object');

  expect(result.count).to.equal(10);
  expect(result.start).to.equal(2);
  expect(result.limit).to.equal(10);
  expect(result.docs).to.be.an('array');
  expect(result.docs.length).to.equal(8);

  cb(null);
});
```
