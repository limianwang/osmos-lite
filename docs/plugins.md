# Plugins

Plugins allow you to extend the functionality provided by Osmos in a multitude of ways by “hooking on” to specific points in its execution flow. A plugin makes it possible to provide functionality that is unique to a particular data store, to combine multiple data stores in useful ways (for example, by implementing a transparent write-through memory cache), and to conveniently augment the capabilities of a document.

## Hooks

Both the Document and Model classes implement the functionality of the `Hookable` class, which allows plugins to be notified before and after crucial steps in Osmos's functionality are executed and alter their functionality.

The hook system is very similar to Node's traditional event system, with the difference that, in keeping with Osmos's fail-safe design, it will not allow you to attach code to a hook that does not exist (for example, because you have misspelled its name).

To attach to a hook, you can use the `hook` method:

    document.hook('willSave', function(document) {
        // Do something here.
    });
    
You can also disconnect a previously-recorded closure from a hook by using the `unhook` method:

    document.unhook('willSave', callback);
    
An object can be asked for a list of its hooks by calling the `getAllHooks` method:

    var hooks = document.getAllHooks();
    
## Creating plugins

A plugin is just a closure that is passed to the `plugin` method of either a `Document` or `Model` instance. The closure is called immediately, receives the instance as its sole parameter, and is responsible for altering it as needed and/or attaching to all necessary hooks.

For example, suppose you have this model:

    var schema = new Schema({
        _primaryKey : [String, configurators.primaryKey],
        name: String,
        lastModifiedDate: Date
    });

    var model = new Model(schema, 'bucket', 'db');
    
If you wanted to, say, set `lastModifiedDate` on a particular document, you could create a plugin like the following:

    function myPlugin(doc) {
        doc.hook('willSave', function(doc, callback) {
            doc.document.lastModifiedDate = new Date();
            callback();
        });
    }

    model.get(primaryKey, function(err, doc) {
        doc.plugin(myPlugin);
    });
    
Just before this document is saved, the `willSave` hook will be called, giving your plugin a chance to alter `lastModifiedDate`. 

Obviously, being forced to attach the plugin to each individual `Document` instance would be time-consuming and error-prone. You can, instead, attach to the model's `create` and `get` hooks:

    function myPlugin(model) {
        function innerPlugin(doc) {
            doc.hook('willSave', function(doc, callback) {
                doc.doc.lastModifiedDate = new Date();
                callback();
            });
        }
        
        model.hook('didCreate', function(doc, callback) {
            doc.doc.plugin(innerPlugin);
            callback();
        });

        model.hook('didGet', function(doc, callback) {
            doc.doc.plugin(innerPlugin);
            callback();
        });
    }

    model.plugin(myPlugin);

This way, `myPlugin` is automatically invoked whenever a new document is created, or a new one is retrieved from the data store; in turn, this allows it to attach `innerPlugin` to each document transparently, without the need to act on each individual document instance.

Note that, as you can see from the code above, plugins are executed asynchronously. It is a plugin's responsibility to execute its callback when it is done running.

## Available hooks

Each of the hooks provided by `Model` and `Document` presents in two form: `will` and `did`. Thus, if you want to attach to the `create` hook of `Model`, you either attach to `willCreate`, which is invoked just before a document creation request is sent to the driver, or to `didCreate`, which is invoked right after the driver has returned a valid document.

To give your handler the ability to modify the values associated with a hook, the system calls it by passing an object that contains zero or more named parameters. You should feel free to modify those as appropriate based on the descriptions below.

### Model

- `willCreate({ error : OsmosError })`
- `didCreate({ document : OsmosDocument , error : OsmosError })`

- `willGet({ primaryKey : Object , error : OsmosError })`
- `didGet({ document: doc , error : OsmosError })`

- `willFindOne({ spec: Object , error : OsmosError })`
- `didFindOne({ document: OsmosDocument ,  error : OsmosError })`

- `willFind({ spec : Object ,  error : OsmosError })`
- `didFind({ documents : Array ,  error : OsmosError })`

- `willDelete({ spec : Object , error : OsmosError })`
- `didDelete({ documents : Array })`

### Document

- `willValidate({ document : OsmosDocument , errors : Array })`
- `didValidate({ document : OsmosDocument , errors: Array })`

- `willSave({ document : OsmosDocument , errors : Array })`
- `didSave({ document : OsmosDocument })`

- `willDelete({ document : OsmosDocument , error : OsmosError })`
- `didDelete({ document : OsmosDocument })`