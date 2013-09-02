# The Osmos Schema

A schema represents the format of a document. It determines which fields it can include (including those that are optional) and which values can be assigned to them.

Osmos 1.x uses [JSON Schema](http://json-schema.org) as its base schema declaration. It supports referencing external schemas (including fetching them via HTTP(s) at runtime) for ease of modularization.

## Declaring a schema

To declare a schema, simply create an instance of the `Osmos.Schema` class:

```javascript
var Osmos = require('osmos-odm');
var Schema = Osmos.Schema;

var schema = new Schema(
  'https://api.tabini.ca/validate/rule/test.model',     An arbitrary URI to assign to the schema
  {
    $schema: "http://json-schema.org/draft-04/schema#",
    description: "A generic model for use with the /test API endpoint",
    type: "object",
    required: ["num","val"],
    additionalProperties: false,
    properties: {
      num: {
        type: "number",
        minimum: 10,
        maximum: 100
      },
      val: {
        type: "string",
        format: "email"
      },
      en: {
        type: "string",
        enum: ["foo","bar"]
      }
    },
    id: "https:/api.tabini.ca/validate/rule/test.model"
  }
);
```

Osmos delegates JSON Schema validation to the [tv4](https://github.com/geraintluff/tv4) library; it validates _both_ the schema itself and any data you write into a document.

<div class="alert tip">
  **Tip:** The `$schema` property is required; both drafts 3 and 4 of the JSON Schema spec are supported.
</div>

## Preregistering schema dependencies

Osmos supports modular schemas through `$ref` references. You can preimport referenced schemas into the `Schema` class by using the `registerSchema` method:

```javascript
Schema.registerSchema('test', {
  $schema: "http://json-schema.org/draft-04/schema#",
  type: 'number',
  minimum: 10
});

var schema = new Schema('marco', {
  $schema: "http://json-schema.org/draft-04/schema#",
  type: 'object',
  properties: {
    val: {
      $ref: 'test'
    }
  }
});
```

## Remote schemas

You can also use `$ref` to reference an external schema accessible through a given HTTP(S) URI; Osmos will automatically detect the reference and download the schema from the Internet.

If you use remote schemas, you may want to listen for the `loaded` event, which an individual schema instance emits when it has finished resolving all external dependencies.

## Format validators

Osmos comes with a wide range of format validators; you can also add your own (and/or redefine existing ones) by using the `registerFormat` method:

```javascript
Schema.registerFormat('sin', function(data, schema) {
  if (typeof data !== string || !/\d{3}\-\d{3}\-\d{3}\/.test(data)) {
    return 'Invalid SIN number';
  }
});
```

The following formats are supported by Osmos out of the box:

| alpha        | A string made up of letters only                                                |
| alphanumeric | A string made up of letters and digits                                          |
| date         | A date (e.g.: 1976-02-23)                                                       |
| dateTime     | A date/time combo (e.g.: 1976-02:23T12:23:00Z)                                  |
| email        | An e-mail address                                                               |
| htmlColor    | An HTML Colour (#xxx, #xxxxxx, rgb(x, x, x), rgba(x, x, x, x), or named colour) |
| httpHttpsUrl | An HTTP or HTTPS URL                                                            |
| httpUrl      | An HTTP URL                                                                     |
| hostname     | A hostname                                                                      |
| ip           | An IPv4 address                                                                 |
| ipv6         | An IPv6 address                                                                 |
| nanpPhone    | A North-American phone number (e.g.: (416) 555-5555)                            |
| time         | A 24-hour time (e.g.: 12:32:23)                                                 |
| uri          | An URI                                                                          |

## Custom document validation

In addition to the built-in JSON Schema validation, Osmos also allows you to apply arbitrary rules to the validation of a document through the `Validate` hook. If you need to modify a document before it is validated, you can hook to `willValidate`, where `didValidate` allows you to perform validation after the JSON Schema validation has taken place. For example:

```javascript
var schema = new Schema('marco', {
  $schema: "http://json-schema.org/draft-04/schema#",
  type: 'object',
  required: ['val'],
  properties: {
    val: {
      type: 'number',
      minimum: 10
    }
  }
});

schema.hook('didValidate', function(doc, cb) {
  cb(new Osmos.Error('Invalid reconfibulator flows detected.', 400));
});
```