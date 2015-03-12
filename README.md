# Osmos: a strict, store-agnostic object data mapper for Node.js

[![Build Status](https://travis-ci.org/limianwang/osmos-lite.svg?branch=master)](https://travis-ci.org/limianwang/osmos-lite)
[![Coverage Status](https://coveralls.io/repos/limianwang/osmos-lite/badge.svg?branch=master)](https://coveralls.io/r/limianwang/osmos-lite?branch=master)
[![npm](https://img.shields.io/npm/v/osmos-lite.svg?style=flat-square)](https://www.npmjs.com/package/osmos-lite)
[![npm](https://img.shields.io/npm/dm/osmos-lite.svg?style=flat-square)](https://www.npmjs.com/package/osmos-lite)

Osmos is a object data mapper (ODM) designed to bridge Node.js apps with any data store that support traditional CRUD operations. It's built on three principles:

- **Stay out of the way.** Osmos is intuitive and largely transparent to developers, and, most of all, doesn't attempt to be “smarter” than its human masters. It can also be easily mocked away for testing without having to write specialized code.

- **Fail early, and fail loudly.** In debug mode, Osmos uses [Direct Proxies](http://wiki.ecmascript.org/doku.php?id=harmony:direct_proxies) to trap access to a document; if attempts are made to read or write non-existent fields, an error is immediately thrown to help you and pinpoint common mistakes before they end up in production.

- **Don't replace developer knowledge.** Osmos is designed to be a generic ODM that will work well with just about any data store that supports CRUD operations. However, it is _not_ meant to be an abstraction layer; instead, it assumes that developers know best, and provides only a simple interface that can be easily extended through plugins.

The current version of Osmos supports [MongoDB](http://www.mongodb.org), [MySQL](http://mysql.org) and [ElasticSearch](http://www.elasticsearch.org), but it should be easy to [write drivers](https://github.com/telemetryapp/osmos/blob/master/docs/drivers/index.md) for just about any data store—and contributions are warmly welcome! The library also includes a simple, memory-based data store that can be used for testing purposes.

## Installation

```
npm install osmos-lite
```

Note that, in debug mode (which is the default mode), Osmos uses Direct Proxies in order to work. Therefore, you must run your instance of node with the `--harmony_proxies` command-line switch. See the [docs](https://github.com/telemetryapp/osmos/blob/master/docs/document.md) for information on how to turn off debug mode in production for extra performance.

## Usage

Using Osmos requires the following steps:

1. **Create a driver instance.** A driver instance connects Osmos to a data store. [Learn more about drivers](https://github.com/telemetryapp/osmos/blob/master/docs/drivers/index.md).

1. **Install and invoke zero or more plugins.** Plugins allow you to extend the functionality provided by Osmos. They are, of course, optional. [Learn more about plugins](https://github.com/telemetryapp/osmos/blob/master/docs/plugins.md)

1. **Define your schemas.** A schema describes the structure of a document, and defines how its data is transformed and validated. [Learn more about schemas](https://github.com/telemetryapp/osmos/blob/master/docs/schema.md)

1. **Define your models.** A model applies a schema to data that is extracted from a data store's specific bucket. [Learn more about models](https://github.com/telemetryapp/osmos/blob/master/docs/model.md)

1. **CRUD.** Models can be used to create, read, update and delete existing document. Two find methods are also supplied. [Learn more about documents](https://github.com/telemetryapp/osmos/blob/master/docs/document.md).

1. **Additional functionality** can be also added to Osmos by a plugin or by a driver—for example, to provide access to features of a data store that are not part of the basic CRUD quartet.

## Contributing

Contributions in the form of patches and pull requests are welcome, provided that you also commit to writing covering unit tests. [Learn more about contributing](https://github.com/telemetryapp/osmos/blob/master/docs/contributing.md).

## Contributors

```
 project  : osmos
 repo age : 1 year, 10 months
 active   : 100 days
 commits  : 291
 files    : 46
 authors  :
   182	Marco Tabini          62.5%
   105	Limian Wang           36.1%
     3	Yehezkiel Syamsuhadi  1.0%
     1	Daniel Prata          0.3%
```

## Roadmap

Version 1.x of the project aims at greatly simplifying its structure by using standard validation based on [JSON Schema](http://json-schema.org) and applying many of the lessons learned through its use in production.

