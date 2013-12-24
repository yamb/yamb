"use strict";

const co = require('co'),
utils = require('./../../utils'),
schema = require('./../schema'),

mdash = require('./../engine/mdash'),
markdown = require('./../engine/markdown'),
translate = require('./../engine/translate');

module.exports = function(symbl, flags, opts) {

  // yamb.prototype.update()
  let update = function(params) {
    if (!utils.is.exst(params) || !utils.is.obj(params)) {
      return this;
    }

    for (let param in params) {
      if (!params.hasOwnProperty(param) || utils.is.und(schema[param])) {
        continue;
      }

      this[param] = params[param];
    }

    return this;
  },

  // yamb.prototype.save()
  save = function(fn) {
    if (!utils.is.fun(fn)) {
      fn = function() {};
    }

    co(function* (that) {
      if (utils.whitespace(that.title)) {
        // TODO: fix error message
        throw new Error('Fill title field');
      }

      if (utils.whitespace(that.preview)) {
        // TODO: fix error message
        throw new Error('Fill preview field');
      }

      if (utils.whitespace(that.text)) {
        // TODO: fix error message
        throw new Error('Fill text field');
      }

      let async = {}, co = false;

      if (that[flags].title) {
        async.title = mdash(that.title);
        that[flags].title = false;
        co = true;
      }

      if (that[flags].preview) {
        async.preview = mdash(that.preview);
        that[flags].preview = false;
        co = true;
      }

      if (that[flags].text) {
        async.text = mdash(that.text);
        that[flags].text = false;
        co = true;
      }

      if (!that.slug && opts.yapi) {
        async.slug = translate(that.title, opts.yapi);
        co = true;
      }

      if (co) {
        let data = yield async;

        if (data.title) {
          that.title = data.title;
        }

        if (data.preview) {
          that.preview = data.preview;
        }

        if (data.text) {
          that.text = data.text;
        }

        if (data.slug) {
          that.slug = data.slug.text && data.slug.text[0] || '';
        }
      }

      if (!that.slug) {
        // TODO: fix error message
        throw new Error('Slug not exists');
      }

      let result = yield opts.storage.save(opts.dbname, that.json());
      if (result === false) {
        return false;
      }

      if (result._id || result.id) {
        that[symbl].id = result._id || result.id;
      }

      return that;
    })(this, fn);
  },

  // yamb.prototype.remove()
  remove = function(fn) {
    if (!utils.is.fun(fn)) {
      fn = function() {};
    }

    if (!this[symbl].id) {
      // TODO: fix error message
      let error = new Error('This is a new object');
      fn(error, false);
      return;
    }

    co(function* (id) {
      let result = yield opts.storage.removeById(opts.dbname, id);

      // TODO: remove all related posts

      return result;
    })(this.id, fn);
  },

  // yamb.prototype.html()
  html = function(text) {
    if (!utils.is.str(text)) {
      return false;
    }

    return markdown(text);
  },

  // yamb.prototype.json()
  json = function() {
    return utils.clone(this[symbl]);
  };

  return {
    update: update,
    save: save,
    remove: remove,
    html: html,
    json: json
  };
};