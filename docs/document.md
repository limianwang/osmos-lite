# Documents

A document represents the union of a data record with the schema and methods you decide to assign to it. Although Osmos provides a `Document` class, you never initialize it directly—the task of creating and populating a document instance is always delegated to a model.

For the most part, Osmos documents behave like every other JavaScript objects; you can read and write their values, execute their methods, and so forth. They are designed so that they are natural to use under most circumstances.

Underneath, however, a document enforces a few extra rules, the most important of which is that you cannot add or remove properties from it at runtime. This is done because one of Osmos's primary design goals is to create an ODM that puts the preservation of its data before anything else.

Consider the simple scenario in which you write some new code where you mistype the name of a field in your document. Because JavaScript normally allows you to add properties to an object at runtime, that mistake may be very hard to track down—or, worse, it may go unnoticed and cause the loss of data. If you use Osmos, on the other way, the document will notify immediately—in the form of a runtime exception (which will, hopefully, be caught by your unit test coverage).

## Reading and writing properties

You read and write a document properties the way you normally would, and the same applies to subdocuments and arrays:

- When you read a value from a field, the raw data that was returned by the backing store for a field is run through any transformers configured on your schema, and then returned to you.
- When you write a value to a field, the data is first checked against all the validators configured for the field, then run through all the transformers configured for it, and finally stored into the raw data storage.

The properties that are part of a document are composed of the following:

- Properties defined in the schema
- Dynamic or derived properties defined in the model
- Intrinsic properties of the document itself

## Dealing with validation errors

Validation occurs in two phases. As soon as you try to write a value into a field, Osmos notifies you as to whether you attempted to access a property that is not defined in the document. This is done on purpose, and the failure occurs loudly (with an exception) in keeping with Osmos' main directive of data safety.

Additionally, when you attempt to save a document, its contents are validated against the schema. If the validation fails, the data is not written to the underlying raw store; instead, the errors are returned to the `save` callback:

```javascript
doc.save(function(err) {
  if (err) // report err here
});
```

The error object augments the normal Node Error object by providing a `statusCode` property, useful when writing Web services, and an `errors` hash, which can be used to determine which errors occurred on which fields. It is generally safe to output `statusCode` and `errors` to an external, non-trusted source.

## Saving a document

The data associated with a document is not saved to the backing store implicitly; you need to call the document's `save` method:

    document.save(callback(err));
    
When `save()` is executed, it first calls up the underlying schema's `validate()` method, and then attempts to write the data to the backing store. If the document is new and a primary key is not set, Osmos calls the `post` method of the underlying driver and makes the new primary key available. Otherwise, it calls `update()` on the driver.
    
## Deleting a document

The document class implements a `delete` method that can be used to remove the current document from the backing store. This method only works if the document's model has a primary key.

## Preserving the raw data

Osmos is designed to work with largely unstructured data; therefore, it is built with the expectation that there might be variance in the documents returned by the backing store.

However, an Osmos document enforces a strict structure on its underlying data, leaving a conflict in scenarios when the information available in the backing store doesn't match the schema that you have designed.

In these cases, Osmos behaves thusly:

- _All_ the data retrieved from the backing store is preserved, unaltered, and sent back as part of a save operation, even if it is not part of the schema.
- Validation and transformation is only enforced at the application level—in other words, validators and transformers are only called when you read from and write to the store.
- Osmos doesn't implicitly transform the data that is read from the backing store. In other words, declaring a field as a `String` does not ensure that you will receive a string when you read from it.

This ensures that a mismatch between your expectations and the backing store doesn't cause a catastrophic loss of data, although at the cost of additional work in ensuring that the data read from a document is of the proper type. This is preferable, in the minds of the designers, to blindly forcing a data-type conversion that could cause the loss of data.

## Accessing the raw data

To accommodate situations in which it is impossible to predict the exact schema of a document in all cases, Osmos exposes a `__raw__` property that represents the actual raw data as it was received from—and will be sent to when `save()` is called—the backing store. No transformations and validations are performed when accessing this property and its contents—which, needless to say, means you should only use it under extraordinary circumstances.

## Nested subdocuments and arrays

You should be able to nest subdocuments arbitrarily, and even use them inside arrays. 

## Avoiding naming conflicts

It's entirely possible for a document to have fields whose name conflicts with a method or property of the underlying `OsmosDocument` instance. In this case, Osmos _almost always_ gives document data the precedence, which means that the underlying property or method cannot be accessed directly. (The only exception to this rule is the `constructor` property, which is required to identify documents and overrides everything else.)

## Exporting documents

By default, document objects override the `toJSON()` method, forcing it to throw an exception. The reason for this is that Osmos is designed to be used in JSON-based service-oriented systems, where it's easy and convenient to retrieve a document and then return it to the caller in JSON format using JavaScript's own facilities.

The problem with this approach is that it's all too easy to accidentally expose privileged information. For this reason, Osmos forces developers to explicitly write their JSON rendering methods in an attempt to force them to think about exactly what information they want to release in the wild.

## Extending documents

Because Osmos uses proxying to strictly marshal access to documents, they cannot be extended through traditional means, like simply adding a new method to their prototype.

Instead, the Model object provides two hashes, `instanceMethods` and `instanceProperties` that can be used to add methods and virtual properties to every object that is instantiated by a particular model. 

For example:

```javascript
var model = new Model(schema, bucket, db);

model.instanceMethods.outputData = function outputData() {
    console.log(this.data);
};

model.instanceProperties.age = {
    get : function getAge() {
        return this.age;
    },
    
    set : function setAge(value) {
        this.age = 10;
    }
};

model.create(err, doc) {
    doc.outputData(); // will output the contents of the document
    doc.age = 20;
    
    console.log(doc.age);
};
```

## Hooks

Documents do not directly expose any hooks; instead, their hooks are proxied through the respective model (as explained in the Model section).
