"use strict";

const utils = require('./../../../utils'),

mdash = require('mdash'),
yandex = require('yandex-translate');

mdash.endpoint = 'http://nko.io/mdash';

function typographer(text) {
  return function(fn) {
    mdash.apply(text, fn);
  };
}

function translate(text, key) {
  return function(fn) {
    yandex(text, {to: 'en', key: key}, fn);
  };
}

// yamb.prototype.save()

module.exports = function(symbl, flags, opts) {
  return function *save() {
    if (utils.whitespace(this.title)) {
      // TODO: fix error message
      throw new Error('Fill title field');
    }

    if (utils.whitespace(this.preview)) {
      // TODO: fix error message
      throw new Error('Fill preview field');
    }

    if (utils.whitespace(this.text)) {
      // TODO: fix error message
      throw new Error('Fill text field');
    }

    let async = {}, co = false;

    if (this[flags].title) {
      async.title = typographer(this.title);
      this[flags].title = false;
      co = true;
    }

    if (this[flags].preview) {
      async.preview = typographer(this.preview);
      this[flags].preview = false;
      co = true;
    }

    if (this[flags].text) {
      async.text = typographer(this.text);
      this[flags].text = false;
      co = true;
    }

    if (!this.slug && opts.yapi) {
      async.slug = translate(this.title, opts.yapi);
      co = true;
    }

    if (co) {
      let data = yield async;

      if (data.title) {
        this.title = data.title;
      }

      if (data.preview) {
        this.preview = data.preview;
      }

      if (data.text) {
        this.text = data.text;
      }

      if (data.slug) {
        this.slug = data.slug.text && data.slug.text[0] || '';
      }
    }

    if (!this.slug) {
      // TODO: fix error message
      throw new Error('Slug not exists');
    }

    let result = yield opts.storage.save(opts.dbname, this.json());
    if (result === false) {
      return false;
    }

    if (result._id || result.id) {
      this[symbl].id = result._id || result.id;
    }

    return this;
  };
};