const sym = Symbol('yamb'),

co = require('co'),

schema = require('./schema'),

markdown = require('./engine/markdown'),
mdash = require('./engine/mdash'),
translate = require('./engine/translate'),

utils = require('./../utils'),

alias = function(self, param) {
  let method = utils.titlecase(param),
      getter = 'get' + method,
      setter = 'set' + method;

  if (!self.hasOwnProperty(getter) && param !== 'active') {
    self[getter] = function() {
      return this[sym][param];
    };
  }

  if (!self.hasOwnProperty(setter) && param !== 'stats' && param !== 'created') {
    self[setter] = function(value) {
      this[sym][param] = value;
      return this;
    };
  }
};

module.exports = function(opts) {

  // Constructor
  let post = function(params) {
    this[sym] = utils.extend({}, schema);
    this[sym].created = new Date();

    if (utils.is.exist(params) && utils.is.obj(params)) {
      this[sym] = utils.extend(this[sym], params);

      if (params.id || params._id) {
        this[sym].id = params._id || params.id;
      }
    }

    return this;
  };

  (function(proto) {
    // post.prototype.update
    proto.update = function(params) {
      let that = this;

      if (!utils.is.exist(params) || !utils.is.obj(params)) {
        return that;
      }

      Object.keys(params).forEach(function(param) {
        if (utils.is.und(schema[param])) {
          return;
        }

        let value  = params[param],
            setter = 'set' + utils.titlecase(param);

        if (utils.is.fun(that[setter])) {
          that[setter](value);
        } else {
          that[sym][param] = value;
        }
      });

      return that;
    };

    // post.prototype.getId
    proto.getId = function() {
      if (!this[sym].id) {
        // TODO: fix error message
        throw new Error('This is a new object');
      }

      return this[sym].id;
    };

    // post.prototype.getUri
    proto.getUri = function() {
      if (!this[sym].slug) {
        // TODO: fix error message
        throw new Error('Slug not exists');
      }

      let date = new Date(this[sym].created),

      pad = function(num) {
        if (num < 10) {
          return '0' + num;
        } else {
          return num;
        }
      },

      uri = [
        date.getFullYear(),
        pad(date.getMonth() + 1),
        this[sym].slug
      ];

      return '/' + uri.join('/');
    };

    // post.prototype.setSlug
    proto.setSlug = function(slug) {
      slug = utils.stringify(slug).toLowerCase();
      slug = slug.replace(/[\-_]+/g, ' ').replace(/[^a-z0-9 ]/g, '');
      slug = slug.trim().replace(/\s+/g, '-');

      this[sym].slug = slug;
      return this;
    };

    // post.prototype.setTitle
    proto.setTitle = function(title) {
      this[sym].title = utils.stringify(title);
      return this;
    };

    // post.prototype.getText
    // post.prototype.getPreview
    ['text', 'preview'].forEach(function(param) {
      let getter = 'get' + utils.titlecase(param);

      proto[getter] = function(html) {
        html = (html === false) ? false : true;

        let text = this[sym][param];

        if (html === true) {
          text = markdown(text);
        }

        return text.trim();
      };
    });

    // post.prototype.setText
    proto.setText = function(text) {
      let fragments = text.split('\n\n');

      let preview = fragments.shift().trim();
      this.setPreview(preview);

      this[sym].text = fragments.join('\n\n').trim();
      return this;
    };

    // post.prototype.setTags
    // post.prototype.setRelated
    ['tags', 'related'].forEach(function(param) {
      let setter = 'set' + utils.titlecase(param);

      // TODO: only unique values
      proto[setter] = function(arr) {
        if (!utils.is.arr(arr)) {
          arr = [arr];
        }

        this[sym][param] = arr;
        return this;
      };
    });

    // TODO: post.prototype.getRelated

    // post.prototype.setActive
    proto.setActive = function(active) {
      if (active === true || active === false) {
        this[sym].active = active;
      }

      return this;
    };

    // post.prototype.isActive
    proto.isActive = function() {
      return this[sym].active;
    };

    // Alias getter/setter methods for schema keys
    let methods = Object.keys(schema);
    for (let i=0, length=methods.length; i<length; i++) {
      alias(proto, methods[i]);
    }

    // post.prototype.save
    proto.save = function(fn) {
      if (!utils.is.fun(fn)) {
        fn = function() {};
      }

      co(function* (that) {
        if (utils.whitespace(that[sym].title)) {
          // TODO: fix error message
          throw new Error('Fill required field');
        }

        if (utils.whitespace(that[sym].preview)) {
          // TODO: fix error message
          throw new Error('Fill required field');
        }

        if (utils.whitespace(that[sym].text)) {
          // TODO: fix error message
          throw new Error('Fill required field');
        }

        let yapi = false,

        data = {
          preview: mdash(that[sym].preview),
          text: mdash(that[sym].text)
        };

        if (!that[sym].slug && opts.yapi) {
          data.slug = translate(that[sym].title, opts.yapi);
          yapi = true;
        }

        data = yield data;

        that[sym].preview = data.preview;
        that[sym].text = data.text;

        if (yapi) {
          let slug = data.slug.text || [''];
          that.setSlug(slug[0]);
        }

        if (!that[sym].slug) {
          // TODO: fix error message
          throw new Error('Slug not exists');
        }

        let result = yield opts.storage.save(opts.dbname, that.toJson());
        if (result._id) {
          that[sym].id = that[sym]._id;
          delete that[sym]._id;
        }

        return that;
      })(this, fn);
    };

    // post.prototype.remove
    proto.remove = function(fn) {
      if (!this[sym].id) {
        // TODO: fix error message
        throw new Error("Can't remove a new object");
      }

      if (!utils.is.fun(fn)) {
        fn = function() {};
      }

      co(function* (id) {
        let result = yield opts.storage.removeById(opts.dbname, id);
        // TODO: remove all related posts
        return result;
      })(this[sym].id, fn);
    };

    // post.prototype.toJson
    proto.toJson = function() {
      return this[sym];
    };

  })(post.prototype);

  return post;
};