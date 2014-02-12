"use strict";

var utils = require('./../../../utils');

var mdash = require('mdash');
var yandex = require('yandex-translate');

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

module.exports = function(priv, opts) {
  return function *save() {
    if (!this.title) {
      // TODO: fix error message
      throw new Error('Fill title field');
    }

    if (!this.preview) {
      // TODO: fix error message
      throw new Error('Fill preview field');
    }

    if (!this.text) {
      // TODO: fix error message
      throw new Error('Fill text field');
    }

    var typo = {};
    if (this[priv.flags].title) {
      typo.title = this.title;
    }

    if (this[priv.flags].preview) {
      typo.preview = this.preview;
    }

    if (this[priv.flags].text) {
      typo.text = this.text;
    }

    var async = {};
    if (!utils.empty(typo)) {
      async.typo = typographer(typo);
    }

    if (!this.uri && opts.yapi) {
      async.slug = translate(this.title, opts.yapi);
    }

    if (!utils.empty(async)) {
      var data = yield async;

      if (data.typo) {
        if (data.typo.title) {
          this.title = data.typo.title;
        }

        if (data.typo.preview) {
          this.preview = data.typo.preview;
        }

        if (data.typo.text) {
          this.text = data.typo.text;
        }
      }

      if (data.slug) {
        this.uri = data.slug.text && data.slug.text[0] || '';
      }
    }

    if (!this.uri) {
      // TODO: fix error message
      throw new Error('Uri not exists');
    }

    if (this[priv.flags].related && !utils.empty(this.related)) {
      var posts = yield opts.storage.find({id: {$in: this.related}}, {sort: {created: -1}});
      var related = [];

      if (!utils.empty(posts)) {
        for (var i=0, length=posts.length; i<length; i++) {
          related[related.length] = '' + (posts[i]._id || posts[i].id);
        }
      }

      this[priv.symbl].related = related;
    }

    if (!this.publish && this.active) {
      this.publish = new Date();
    }

    var result;

    if (this.id) {
      result = yield opts.storage.update({id: this.id}, {$set: this.json(true)});
    } else {
      result = yield opts.storage.save(this.json());
    }

    if (result === false) {
      return false;
    }

    if (!this.id && (result._id || result.id)) {
      this[priv.symbl].id = result._id || result.id;
    }

    return this.reset();
  };
};