"use strict";

const co = require('co'),

schema = require('./../schema'),

mdash = require('./../engine/mdash'),
translate = require('./../engine/translate'),

utils = require('./../../utils');

module.exports = function(opts) {

  let methods = {
    // yamb.prototype.update()
    update: function(params) {
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
    save: function(fn) {
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

        if (that[opts.flags].preview) {
          async.preview = mdash(that.preview);
          that[opts.flags].preview = false;
          co = true;
        }

        if (that[opts.flags].text) {
          async.text = mdash(that.text);
          that[opts.flags].text = false;
          co = true;
        }

        if (!that.slug && opts.yapi) {
          async.slug = translate(that.title, opts.yapi);
          co = true;
        }

        if (co) {
          let data = yield async;

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
        if (result === false) {
          return false;
        }

        if (result._id || result.id) {
          that[opts.sym].id = result._id || result.id;
        }

        return that;
      })(this, fn);
    },

    // yamb.prototype.remove()
    remove: function(fn) {
      if (!utils.is.fun(fn)) {
        fn = function() {};
      }

      if (!this[opts.sym].id) {
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

    // yamb.prototype.toJson()
    toJson: function() {
      return utils.clone(this[opts.sym]);
    }
  };

  return methods;
};