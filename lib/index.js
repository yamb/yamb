const co = require('co'),

utils = require('./utils');

module.exports = function(opts) {
  opts.dbname = opts.dbname || 'yamb';

  if (!opts.storage) {
    // TODO: fix error message
    throw new Error('error with storage');
  }

  const Yamb = require('./post')(opts),

  fetch = function(args) {
    co(function* (args) {
      let results = yield opts.storage.find(opts.dbname, args.params, args.options);

      if (!results || results.length === 0) {
        return false;
      }

      let response;
      if (args.one === true) {
        response = new Yamb(results[0]);
      } else {
        let post, i, length = results.length;

        response = new Map();
        for (i=0; i<length; i++) {
          post = new Yamb(results[i]);
          response.set(post.uri, post);
        }
      }

      return response;
    })(args, args.fn);
  },

  normalize = function(params, options, fn) {
    if (utils.is.fun(params)) {
      fn = params;
      params = null;
      options = {};
    } else if (utils.is.fun(options)) {
      fn = options;
      options = {};
    }

    if (!utils.is.fun(fn)) {
      fn = function() {};
    }

    return {
      params: params,
      options: options,
      fn: fn
    };
  };

  return {
    create: function(data) {
      let post = new Yamb();
      return post.update(data);
    },

    fetch: function(params, options, fn) {
      let args = normalize(params, options, fn);

      args.options.limit = 1;
      args.one = true;

      fetch(args);
    },

    fetchAll: function(params, options, fn) {
      let args = normalize(params, options, fn);
      fetch(args);
    },

    remove: function(params, fn) {
      if (!utils.is.fun(fn)) {
        fn = function() {};
      }

      co(function* () {
        let results = yield opts.storage.remove(opts.dbname, params);
        // TODO: remove all related posts
        return results;
      })(fn);
    }
  };
};