# Schemas

A schema represents the precise structure of a document. Because strictness is one of Osmos's design goal, schemas dictate what you can and cannot do within a document; as such, it is very important that you understand how they work. Luckily, simplicity being another design goal of Osmos, they are also very simple to grok.

## Schema basics

A schema is primarily a collection of these elements:

- Field descriptor
- The global validator

Here's a simple example:

    var BookSchema = new Osmos.Schema({
        
        isbn : String,
        
        author: String,
        title: String,
        pageCount: Number
        
    });

    Bookschema.validate = function validateBookSchema(errors, callback) {
        if (errors.length) return callback(errors);
        
        if (this.author == this.title) {
            callback([ new Osmos.Error('Title and author cannot be equal!') ]);
        }
    };
    
When you instantiate a document from a model that is based on this schema, you will end up with an object that has the following:

- The `isbn`, `author`, and `title` properties, derived from the data store record; the schema will ensure that these are treated as strings.
- The `pageCount` property, also derived from the data store record; the schema will ensure that this is treated as a number.
- A global validator, encapsulated by the `validate` method.

## The schema format

The schema constructor takes a hash that describes all the fields that make up a document. The key of each item in the hash provides a name for the field, while the value—called a “descriptor”—instructs Osmos on how the field should be treated.

A descriptor can be one of:

- A base type (see _Using base types_ below)
- A custom descriptor object (see _Custom descriptors_ below)
- An array that contains one or more descriptor methods (see _Descriptor methods_ below)

## Using base types

Unlike JavaScript, Osmos requires that each field be given a specific type. Attempts to store data of the wrong type in a field will result in the data being converted (if possible), or an error being thrown.

If all you want to do is declare a field with a specific JavaScript type, you can simply using the corresponding class as its descriptor, like I did above for `BookSchema`.

Osmos supports these built-in base types:

- String
- Number
- Date
- Buffer
- Boolean

## Descriptor methods

When you need something more than the simple functionality provided by one of the base type descriptors, you can define a descriptor as an array of one ore more _descriptor methods._

Descriptor methods are divided in three categories, each capable of altering the behaviour of a field in a specific way:

- _Configurators_ change the field's settings. For example, they allow you to set a field as read-only, or to make it optional, and so forth.
- _Validators_ allow you to ensure that any value that ends up in a field follows one or more sets of arbitrary rules. Note that base types (e.g.: `String`, `Number`, etc.) can also be used as validators.
- _transformers_ allow you to transform the raw data you receive from the backing store before it's passed on to the developer, and to transform it again before it is sent back to the data store.

Osmos provides several built-in configurators and validators (but, notably, no transformers) that you can—and probably will—use at some point or other.

Thus, for example, if you wanted to configure a field called `uniqueId` as a numeric primary key that must be greater than zero and is aliased to the field `id`, you'd probably use something like this:

    var Osmos = require('osmos');
    var Schema = Osmos.Schema;
    var validators = Schema.validators;
    var configurators = Schema.configurators;
    
    var MySchema = new Osmos.Schema({
        uniqueId : [ 
            Number, 
            configurators.primaryKey, 
            configurators.alias('id'),
            validators.numberRange(0),
        ] 
    });

With some minor limitations (see _Some notes on transformers_ below), there is no need to list the methods in a specific order; Osmos can tell the various kinds apart from each other automatically.

## A note about fields

Remember that Osmos is a _strict_ ODM. As such, _every single field_ that could conceivably be part of a document must be described in the schema in order for you to be able to either read or write it directly from an Osmos document object. 

This doesn't mean, however, that Osmos only supports fixed document schemas. Although fields are required by default, you can make them optional; also, data returned by the backing store is preserved even if it's not part of the document schema, but can only be manipulated directly by altering the `raw` collection of a document. (For a discussion of why this is the case, refer to the chapter on Models.)

## Array fields and sub-documents

Fields that represent an array of values can be described by using the `Array` descriptor method alongside another data type. For example:

    var MySchema = new Osmos.Schema {
        value : [ Array , Number ]
    }

You can similarly describe a subdocument—a hash within your main document—by using the `Object` descriptor alongside a Schema:

    var MySchema = new Osmos.Schema {
        subdoc : [
            Object,
            new Osmos.Schema {
                // Describe the sub-document here.
            }
        ];
    }

The subdocument Schema is essentially the same as a regular document descriptor (and can, in fact, contain further subdocuments).

## The global validator

In addition to validating individual fields, you can also specify a “global” validator for the entire schema by implementing a `validate` method like the one you see in the first example of this chapter.

The global validator is called _after_ all fields have been validated, and receives in input an array that contains any errors that have been raised by the various field validators, alongside a closure that must be called with the final array of errors.

Typically, you can use the global validator to perform complex validations that involve multiple fields, or to somehow manipulate the error array (for example, to collapse multiple similar errors in a single error message, or to count them and add a generic “x errors found” error). Either way, you _must_ pass an array of errors to the callback, even if it is empty.

## Configurators

Configurators are called when a new document is instantiated (either directly or by loading data from a backing store), and can be used to alter the field's metadata in whatever way is appropriate. Osmos comes with a number of built-in configurators (found in the `lib/schema/configurators` directory), such as:

- `Osmos.Schema.configurators.primaryKey` indicates that a field is the primary key of a document
- `Osmos.Schema.configurators.optional` indicates that the field is optional
- `Osmos.Schema.configurators.alias(backingFieldName)` allows you to alias a field to a specific name in the backing store. This is handy when you want to have very descriptive names in your code, but save bandwidth and storage space by using shorter keys in the backing store

### Custom configurators

You can also write your own configurators; they are simple functions that take a document, a field name, and a callback, which takes an optional `Osmos.Error` instance to indicate an error (which will cause an exception to be thrown). To let Osmos know that these methods are, in fact, configurators, you must also use `Osmos.Schema.Configurator` as their constructor. For example:

    var Osmos = require('osmos');
    var expect = Osmos.expect;
    var Schema = Osmos.Schema;

    var myPrimaryKey = function(document, field, callback) {
        expect(document.primaryKeyFieldName).to.be.undefined;
        document.primaryKeyFieldName = field.name;
        callback();
    };
    
    myPrimaryKey.constructor = Schema.Configurator;
    
Note that configurators are executed asynchronously and in parallel. Therefore, it is a programmer error to expect them to run in a particular order.
    
## Validators

The job of a validator, as its name implies, is to inspect the data that flows into a model and ensure that it conforms to an arbitrary set of rules. Osmos comes with a small number of built-in validators to reflect its focus on simplicity—more validators may be available as plugins:

- `Osmos.Schema.validators.numberRange(min, max)` ensures that a number falls within a given range
- `Osmos.Schema.validators.stringMatch(regex)` ensures that a string value matches a given regular expression
- `Osmos.Schema.validators.stringEnum(possibleValues)` ensures that a string value matches one of a specific set of values

Remember that a field can have zero validators, in which case no validation is performed.

### Custom validators

Like with configurators, you can create your own validators to perform whatever checks you need in your code by creating a custom function that follow this signature:

    var validator = function(document, field, value, callback);
    
    validator.constructor = Osmos.Schema.Validator;
    
The `document` parameter points to the current document, while `field` identifies the field that is being validated, and `value` its value. When the validation is complete, the validator should call `callback` with either an instance of `Osmos.Error` to indicate an error condition, which will cause the field's value not to be set and an error being bubbled up to the original caller.

For example, here's a way to validate the ISBN number associated with a field:

    var isbnValidator = function isbnValidator(document, field, value, callback) {
        // Validators are always executed in parallel. We delegate
        // making sure that the value is a string to another validator,
        // but we still need to make sure that the value has 
        // the required method and properties to allow us to perform
        // our validation
        
        if (!value.length || !value.substr) return callback();
        
        var index, sum;
        
        switch(value.length) {
            
            case 10: 
            
                for (index = 0; index < 9; index++) {
                    sum += value.substr(index, 1) * (index + 1);
                }
                
                if (parseInt(index.substr(-1, 1)) != (sum % 11)) {
                    return callback(new Osmos.Error('ISBN string fails checksum.'));
                }
            
                break;
                
            case 13:
            
                for (index = 0; index < 12; index++) {
                    sum += value.substr(index, 1) * (index % 2 == 0 ? 1 : 3);
                }
            
                if (parseInt(index.substr(-1, 1)) != (sum % 10)) {
                    return callback(new Osmos.Error('ISBN string fails checksum.'));
                }
                
                break;
                
            default:
            
                callback(new Osmos.Error('Invalid ISBN string.'));
        }
        
    };
    
    isbnValidator.constructor = Osmos.Schema.Validator;
    
Note that validators, like configurators, are executed asynchronously and in parallel. Expecting them to run in a specific order is, in the same way, programmer error.

### Type validators

A special class of validators indicates the _basic type_ of a given field. These include the supported built-in JavaScript types listed above (see _Using Basic Types_), or a custom object that uses `Osmos.Schema.TypeValidator` as its constructor. Each field exactly one type validator, unless it implements one or more transformers (see _Transformers_ below). The only exception to this rule is if the type validator is `Array`, in which case a secondary type validator must also be provided to indicate the type of the array's items.

## Transformers

Transformers are used to convert the raw data provided by the backing store into a format suitable for use inside your JavaScript apps. They are useful primarily in two scenarios:

1. When you want to represent data using a type other than what is in the backing store (e.g.: use MongoDB's ObjectIDs as strings).
2. When you want to represent a field using a custom class
3. When you want to consume the data in a different format in-code and in the backing store.

### Overloading field types

It is sometimes useful to represent data in JavaScript using a custom class even though it is sent to the backing store as a simple hash, or vice versa. For example, using MongoDB's `ObjectID` class directly is impractical—a string is much more convenient. A transformer makes this possible by modifying the data before it is sent outside a document, and modifying it again when it is stored inside the document—think of it as a combination getter and setter, wrapped into an object. For example:

    var ObjectID = require('mongodb').ObjectID;
    var Osmos = require('osmos');
    var Mongo = Osmos.drivers.Mongo;
    var expect = Osmos.expect;

    var Mongo.tranformers.objectId = {
        get : function get(document, field, value, callback) {
            try {
                expect(value.toHexString, 'The field ' + field.name + ' is not an ObjectID.').to.be.a.('function');
            } catch(e) {
                return callback(e);
            }
            
            return value.toHexString();
        }
        
        set : function set(document, field, value, callback) {
            try {
                expect(value, 'The field ' + field.name + ' can only accept string values.').to.be.a('string');
                expect(value, 'The field ' + field.name + ' must be 24 characters long.').to.have.length(24);
            } catch(e) {
                return callback(e);
            }
            
            callback(null, new ObjectID(value));
        }
    }
    
    Mongo.tranformers.objectId.constructor = Osmos.Schema.Transformer;
    
Note that, when you overload a field type, the validators operate on the overloaded value, and not on the raw value from the backing store.

### Reformatting field data

The other typical use case for transformers is when you want to use a different representation for a given field, but without necessarily using a custom class. For example, consider a field that represents the ISBN of a book. It might be appropriate to represent the ISBN using dashes in JavaScript, but to store the data without dashes for performance and indexing reasons. In that case, a transformer will do the trick:

    var Osmos = require('osmos');
    var expect = Osmos.expect;

    var isbnTransformer = function isbnTransformer {
        get : function get(document, field, value, callback) {
            if (value.length == 13) {
                return value.substr(0, 3) + '-' +
                       value.substr(3, 1) + '-' +
                       value.substr(4, 2) + '-' +
                       value.substr(6, 6) + '-' +
                       value.substr(12, 1);
            }
        }
    
        set : function set(document, field, value, callback) {
            callback(null, value.replace(/-/, ''));
        }
    }
    
    isbnTransformer.constructor = Osmos.Schema.Transformer;

### Some notes on transformers

As you have probably noticed, the line between validators and transformers is somewhat blurry. As a general rule, you should keep validation into the validators whenever possible, because they are executed in parallel, and because that's their intended purpose. The only circumstance under which it makes sense to perform validation inside a transformer is when you're dealing with a custom class.

Also, you should keep in mind that transformers are _not_ formatters, and should be used with care. A good example of when it's _not_ a good idea to use a formatter is when you want to display a number in human-readable format (e.g.: 12,324 instead of 12324). In this case, a formatter corners you into only being able to access the value as a string, preventing you from using it mathematical expressions.

Finally, you should keep in mind that transformers are executed _after_ all the validators have successfully returned. In the event of a validation error, they are never invoked. It is possible (although unlikely) to have multiple transformers, in which case they are executed in a waterfall, with the value returned from one fed into the next. Thus, the order in which they are specified is important.
