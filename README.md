# Osmos: a strict, store-agnostic object data mapper for Node.js

[![Build Status](https://travis-ci.org/limianwang/osmos-lite.svg?branch=master)](https://travis-ci.org/limianwang/osmos-lite)
[![Coverage Status](https://coveralls.io/repos/limianwang/osmos-lite/badge.svg?branch=master)](https://coveralls.io/r/limianwang/osmos-lite?branch=master)
[![npm](https://img.shields.io/npm/v/osmos-lite.svg?style=flat-square)](https://www.npmjs.com/package/osmos-lite)
[![npm](https://img.shields.io/npm/dm/osmos-lite.svg?style=flat-square)](https://www.npmjs.com/package/osmos-lite)
[![Dependency Status](https://david-dm.org/limianwang/osmos-lite.svg?style=flat-square)](https://david-dm.org/limianwang/osmos-lite)
[![devDependency Status](https://david-dm.org/limianwang/osmos-lite/dev-status.svg?style=flat-square)](https://david-dm.org/limianwang/osmos-lite#info=devDependencies)

Osmos is a object data mapper (ODM) designed to bridge Node.js apps with any data store that support traditional CRUD operations. It's built on three principles:

**NOTE**

> `osmos-lite` is a forked version of [Osmos-odm](https://github.com/telemetryapp/osmos) aiming to provide support for iojs, node > 0.10. One of the major reasons for forking is to be able to iterate fast, and break things earlier without having too much of an impact.

- **Stay out of the way.** Osmos is intuitive and largely transparent to developers, and, most of all, doesn't attempt to be “smarter” than its human masters. It can also be easily mocked away for testing without having to write specialized code.

- **Don't replace developer knowledge.** Osmos is designed to be a generic ODM that will work well with just about any data store that supports CRUD operations. However, it is _not_ meant to be an abstraction layer; instead, it assumes that developers know best, and provides only a simple interface that can be easily extended through plugins.

## Installation

```
npm install osmos-lite --save
```

## Usage

Using Osmos requires the following steps:

1. **Create a driver instance.** A driver instance connects Osmos to a data store. [Learn more about drivers](docs/drivers/index.md).

1. **Define your schemas.** A schema describes the structure of a document, and defines how its data is transformed and validated. [Learn more about schemas](docs/schema.md)

1. **Define your models.** A model applies a schema to data that is extracted from a data store's specific bucket. [Learn more about models](docs/model.md)

1. **CRUD.** Models can be used to create, read, update and delete existing document. Two find methods are also supplied. [Learn more about documents](docs/document.md).

1. **Additional functionality** can be also added to Osmos by a plugin or by a driver—for example, to provide access to features of a data store that are not part of the basic CRUD quartet.

## Roadmap

Next iteration of updates will focus heavily on the fixes and enhancement for `osmos-lite`, use Promises, and increase the test coverage.

## Contributing

Contributions are always welcomed via pull requests, and they should always have associated tests. TravisCI will need to pass prior to merging.

## Contributors

```
$ git summary

 project  : osmos-lite
 repo age : 2 years, 1 month
 active   : 131 days
 commits  : 371
 files    : 41
 authors  :
   185	Limian Wang           49.9%
   182	Marco Tabini          49.1%
     3	Yehezkiel Syamsuhadi  0.8%
     1	Daniel Prata          0.3%
```
