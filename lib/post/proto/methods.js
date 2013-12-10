"use strict";

const co = require('co'),

schema = require('./../schema'),

mdash = require('./../engine/mdash'),
translate = require('./../engine/translate'),

utils = require('./../../utils');

module.exports = function(opts) {

  let methods = {
    flags: {
      text: false,
      preview: false
    },

    // yamb.prototype.update()
    update: function(params) {
      if (!utils.is.exist(params) || !utils.is.obj(params)) {
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
    save: function(fn) {
      if (!utils.is.fun(fn)) {
        fn = function() {};
      }

      co(function* (that) {
        let title = that.title,
            preview = that[opts.sym].preview,
            text = that[opts.sym].text;

        if (utils.whitespace(title)) {
          // TODO: fix error message
          throw new Error('Fill required field');
        }

        if (utils.whitespace(preview)) {
          // TODO: fix error message
          throw new Error('Fill required field');
        }

        if (utils.whitespace(text)) {
          // TODO: fix error message
          throw new Error('Fill required field');
        }

        let data = {}, co = false;

        if (that.flags.preview) {
          data.preview = mdash(preview);
          that.flags.preview = false;
          co = true;
        }

        if (that.flags.text) {
          data.text = mdash(text);
          that.flags.text = false;
          co = true;
        }

        if (!that.slug && opts.yapi) {
          data.slug = translate(title, opts.yapi);
          co = true;
        }

        if (co) {
          data = yield data;

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

        let result = yield opts.storage.save(opts.dbname, that.toJson());
        if (result._id) {
          that[opts.sym].id = that[opts.sym]._id;
          delete that[opts.sym]._id;
        }

        return that;
      })(this, fn);
    },

    // yamb.prototype.remove()
    remove: function(fn) {
      if (!utils.is.fun(fn)) {
        fn = function() {};
      }

      co(function* (id) {
        let result = yield opts.storage.removeById(opts.dbname, id);
        // TODO: remove all related posts
        return result;
      })(this.id, fn);
    },

    // yamb.prototype.toJson()
    toJson: function() {
      return this[opts.sym];
    }
  };

  return methods;
};