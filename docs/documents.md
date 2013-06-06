# Documents

A document represents the union of a data record with the schema and methods you decide to assign to it. Although Osmos provides a `Document` class, you never initialize it directly—the task of creating and populating a document instance is always delegated to a model.

For the most part, Osmos documents behave like every other JavaScript objects; you can read and write values, execute methods, and so forth. They are designed so that they are natural to use under most circumstances.

Underneath, however, a document enforces a few extra rules, the most important of which is that you cannot add or remove properties from it at runtime. This is done because one of Osmos's primary design goals is to create an ODM that puts the preservation of its data before anything else.

Consider the simple scenario in which you write some new code where you mistype the name of a field in your document. Because JavaScript normally allows you to add properties to an object at runtime, that mistake may be very hard to track down—or, worse, it may go unnoticed and cause the loss of data. If you use Osmos, on the other way, the document will notify immediately—in the form of a `TypeError` runtime exception (which will, hopefully, be caught by your unit test coverage).

## Reading and writing properties

You read and write a document properties the way you normally would, and the same applies to subdocuments and arrays:

- When you read a value from a field, the raw data that was returned by the backing store for a field is run through any transformers configured on your schema, and then returned to you.
- When you write a value to a field, the data is first checked against all the validators configured for the field, then run through all the transformer configured for it, and finally stored into the raw data storage.

## Dealing with validation errors

Validation occurs as soon as you try to write a value into a field. If the validation fails, the data is not written to the underlying raw store; if Osmos determines that the error is a design-time error—the kind you want the developer to correct before the code goes into production—it will be thrown in an exception. Otherwise, it is stored in the `errors` array of the document, and it is not reported until a save operation is performed.

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
- Validation and transformation is only enforced at the application level—in other words, validators and transformers are only called when you read and write to the store.
- Osmos doesn't implicitly transform the data that is read from the backing store. In other words, declaring a field as a `String` does not ensure that you will receive a string when you read from it.

This ensures that a mismatch between your expectations and the backing store doesn't cause a catastrophic loss of data, although at the cost of additional work in ensuring that the data read from a document is of the proper type. This is preferable, in the minds of the designers, to blindly forcing a data-type conversion that could cause the loss of data.

For example, consider this raw document and schema:

    {
        id : 12345,
        name: 'Marco',
        age: '24'
    }
    
    Schema({
        id: [Number, configurators.primaryKey ],
        name: String,
        age: [Number, validators.numberRange(18, 99)]
    })
    
Reading `age` from the document will return a string even though the field is declared as a number. Although this forces the developer to be a little more cautious with their data, it makes it possible to introduce more specificity in the document's schema by means of the transformers. Consider this other document:

    {
        id: 234556,
        name: 'Daniel',
        age: 'eighteen'
    }
    
If Osmos were hardwired to convert the `age` field to a `Number` before executing any transformers, the data stored in it would be irremediably lost, without the opportunity to write a transformer that, for example, could convert `eighteen` into the corresponding numeric value (and back).

## Accessing the raw data

To accommodate situations in which it is impossible to predict the exact schema of a document in all cases, Osmos exposes a `__data__` property that represents the actual raw data as it was received from—and will be sent to when `save()` is called—the backing store. No transformations and validations are performed when accessing this property and its contents—which, needless to say, means you should only use it under extraordinary circumstances.

## Avoiding naming conflicts

It's entirely possible for a document to have fields whose name conflicts with a method or property of the underlying `OsmosDocument` instance. In this case, Osmos _almost always_ gives document data the precedence, which means that the underlying property or method cannot be accessed directly. (The only exception to this rule is the `constructor` property, which is required to identify documents and overrides everything else.)

For example:

    var schema = new Schema({
        errors: [Array, String]
    });

    var model = new Model(schema, 'log', 'db');
    
    model.create(function(err, doc) {
        console.log(doc.errors); // ???
    });
    
Attempting to read `errors` from a document derived from the schema above poses a problem: does the developer want to access the `errors` field in the data, or the `errors` property of the `OsmosDocument` instance? Osmos will always return the former; if you want to access the latter, you can do so by using the `__document__` pseudo-property, which bypasses Osmos's proxying functionality and gives you direct access to the `OsmosDocument` class methods.