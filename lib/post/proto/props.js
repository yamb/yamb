"use strict";

const markdown = require('./../engine/markdown'),

utils = require('./../../utils');

module.exports = function(opts) {

  let props = {};

  props.id = {
    get: function() {
      if (!this[opts.sym].id) {
        // TODO: fix error message
        throw new Error('This is a new object');
      }

      return this[opts.sym].id;
    },
    set: false
  };

  props.uri = {
    get: function() {
      if (!this.slug) {
        // TODO: fix error message
        throw new Error('Slug not exists');
      }

      let pad = function(num) {
        if (num < 10) {
          return '0' + num;
        } else {
          return num;
        }
      },

      uri = [
        this.created.getFullYear(),
        pad(this.created.getMonth() + 1),
        this.slug
      ];

      return '/' + uri.join('/');
    },
    set: false
  };

  props.slug = {
    set: function(slug) {
      slug = utils.stringify(slug).toLowerCase();
      slug = slug.replace(/[\-_]+/g, ' ').replace(/[^a-z0-9 ]/g, '');
      slug = slug.trim().replace(/\s+/g, '-');

      this[opts.sym].slug = slug;
      return this;
    }
  };

  props.title = {
    set: function(title) {
      this[opts.sym].title = utils.stringify(title);
      return this;
    }
  };

  let mdGetter = function(param) {
    return function() {
      let text = markdown(this[opts.sym][param]);
      return text.trim();
    };
  };

  props.preview = {
    get: mdGetter('preview'),
    set: function(text) {
      this[opts.sym].preview = utils.stringify(text);
      this.flags.preview = true;
      return this;
    }
  };

  props.text = {
    get: mdGetter('text'),
    set: function(text) {
      text = utils.stringify(text);

      if (!this[opts.sym].preview) {
        let fragments = text.split('\n\n');
        this.preview = fragments.shift();
        text = utils.stringify(fragments.join('\n\n'));
      }

      this[opts.sym].text = text;
      this.flags.text = true;
      return this;
    }
  };

  let arrSetter = function(param) {
    // TODO: only unique values
    return function(arr) {
      if (!utils.is.arr(arr)) {
        arr = [arr];
      }

      this[opts.sym][param] = arr;
      return this;
    };
  };

  props.tags = {
    set: arrSetter('tags')
  };

  props.related = {
    get: function() {
      // TODO: implement getting yamb object for related
      return this[opts.sym].related;
    },
    set: arrSetter('related')
  };

  props.created = {
    get: function() {
      return new Date(this[opts.sym].created);
    },
    set: false
  };

  props.active = {
    set: function(active) {
      if (active === true || active === false) {
        this[opts.sym].active = active;
      }

      return this;
    }
  };

  return props;
};