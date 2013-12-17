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
    validate: function(value) {
      return utils.is.str(value);
    },
    set: function(slug) {
      if (!props.slug.validate(slug)) {
        return this;
      }

      slug = utils.stringify(slug).toLowerCase();
      slug = slug.replace(/[\-_]+/g, ' ').replace(/[^a-z0-9 ]/g, '');
      slug = slug.trim().replace(/\s+/g, '-');

      this[opts.sym].slug = slug;
      return this;
    }
  };

  props.title = {
    validate: function(value) {
      return utils.is.str(value);
    },
    set: function(title) {
      if (props.title.validate(title)) {
        this[opts.sym].title = utils.stringify(title);
      }
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
      this[opts.flags].preview = true;
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
      this[opts.flags].text = true;
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
    validate: function(value) {
      return utils.is.dat(value) || (utils.is.str(value) && utils.is.dat(new Date(value)));
    },
    get: function() {
      var date = this[opts.sym].created;

      if (utils.is.str(date)) {
        date = new Date(date);
      }

      return date;
    },
    set: false
  };

  props.active = {
    validate: function(value) {
      return value === true || value === false;
    },
    set: function(active) {
      if (props.active.validate(active)) {
        this[opts.sym].active = active;
      }

      return this;
    }
  };

  return props;
};