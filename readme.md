# Yamb

[![NPM version][npm-image]][npm-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![Code climate][climate-image]][climate-url]
[![Dependency status][dependency-image]][dependency-url]
[![devDependency status][devdependency-image]][devdependency-url]

Currently you must use the `--harmony` flag when running node 0.11.x to get access to generators.

You can chat with me. Thanks to [gitter](https://gitter.im/yamb).

[![Gitter chat](https://badges.gitter.im/yamb.png)](https://gitter.im/yamb)

## Installation

```bash
$ npm install yamb
```

## Examples

```js
var co = require('co');

var mongo = require('co-easymongo')({
  dbname: 'test'
});

var yamb = require('yamb')({
  storage: mongo.collection('posts')
});

co(function *() {
  var post = yamb.create({
    title: 'Yamb header',
    text: 'Yamb markdown **text**'
  });

  post = yield post.save();

  console.log(post.json());
})();
```

## API

### Yamb

### Options

* `storage` (object) — mongodb driver, for example [co-easymongo](https://github.com/meritt/co-easymongo) or any related.
* `yapi` (string) — api key for [yandex translate service](http://api.yandex.ru/translate/) (optional).

### Methods

* `create([data])` — returns a new instance of the [Yamb class](#yamb-class).
* `fetch([params][, options])` — find document via `params` and return [Yamb instance](#yamb-class).
* `fetchAll([params][, options])` — find documents via `params` and return array of [Yamb instance](#yamb-class).
* `remove([params])` — remove documents.

### Yamb class

### Methods

* `update(params)` — update all the properties from `params`.
* `save()` — save all data to storage.
* `remove()` — remove from storage.
* `reset()` — reset all changes.
* `similar([all=false])` — returns an array of similar Yamb's.
* `next([all=false])` — returns next Yamb, if not found returns false.
* `prev([all=false])` — returns previous Yamb, if not found returns false.
* `html(text)` — convert markdown text to html.
* `json([newer=false])` — returns all properties in json format.

### Properties

* `uri` — _string_
* `title` – _string_
* `preview` – _markdown text_
* `text` – _markdown text_
* `cover` – _string_
* `author` – _object_
* `tags` – _array_
* `related` – _array_
* `meta` – _object_
* `social` – _object_
* `stats` – _object_
* `created` – _date_
* `publish` – _date_
* `active` – _boolean_

For more info about properties look to [default schema file](https://github.com/yamb/yamb/blob/master/lib/yamb/schema.json).

## Author

  - [Alexey Simonenko](https://github.com/meritt)

## License

The MIT License, see the included `license.md` file.

[npm-image]: https://img.shields.io/npm/v/yamb.svg?style=flat
[npm-url]: https://npmjs.org/package/yamb
[travis-image]: https://img.shields.io/travis/yamb/yamb.svg?style=flat
[travis-url]: https://travis-ci.org/yamb/yamb
[coveralls-image]: https://img.shields.io/coveralls/yamb/yamb.svg?style=flat
[coveralls-url]: https://coveralls.io/r/yamb/yamb?branch=master
[climate-image]: https://img.shields.io/codeclimate/github/yamb/yamb.svg?style=flat
[climate-url]: https://codeclimate.com/github/yamb/yamb
[dependency-image]: https://img.shields.io/david/yamb/yamb.svg?style=flat
[dependency-url]: https://david-dm.org/yamb/yamb
[devdependency-image]: https://img.shields.io/david/dev/yamb/yamb.svg?style=flat
[devdependency-url]: https://david-dm.org/yamb/yamb#info=devDependencies