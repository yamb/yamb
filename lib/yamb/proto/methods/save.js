"use strict";

const utils = require('./../../../utils'),

co = require('co'),
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
  return function save(fn) {
    if (!utils.is.fun(fn)) {
      fn = function() {};
    }

    co(function *(yamb) {
      if (utils.whitespace(yamb.title)) {
        // TODO: fix error message
        throw new Error('Fill title field');
      }

      if (utils.whitespace(yamb.preview)) {
        // TODO: fix error message
        throw new Error('Fill preview field');
      }

      if (utils.whitespace(yamb.text)) {
        // TODO: fix error message
        throw new Error('Fill text field');
      }

      let async = {}, co = false;

      if (yamb[flags].title) {
        async.title = typographer(yamb.title);
        yamb[flags].title = false;
        co = true;
      }

      if (yamb[flags].preview) {
        async.preview = typographer(yamb.preview);
        yamb[flags].preview = false;
        co = true;
      }

      if (yamb[flags].text) {
        async.text = typographer(yamb.text);
        yamb[flags].text = false;
        co = true;
      }

      if (!yamb.slug && opts.yapi) {
        async.slug = translate(yamb.title, opts.yapi);
        co = true;
      }

      if (co) {
        let data = yield async;

        if (data.title) {
          yamb.title = data.title;
        }

        if (data.preview) {
          yamb.preview = data.preview;
        }

        if (data.text) {
          yamb.text = data.text;
        }

        if (data.slug) {
          yamb.slug = data.slug.text && data.slug.text[0] || '';
        }
      }

      if (!yamb.slug) {
        // TODO: fix error message
        throw new Error('Slug not exists');
      }

      let result = yield opts.storage.save(opts.dbname, yamb.json());
      if (result === false) {
        return false;
      }

      if (result._id || result.id) {
        yamb[symbl].id = result._id || result.id;
      }

      return yamb;
    })(this, fn);
  };
};