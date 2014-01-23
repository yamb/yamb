"use strict";

const utils = require('./utils');

module.exports = function(opts) {
  if (!opts.storage) {
    // TODO: fix error message
    throw new Error('error with storage');
  }

  const Yamb = require('./yamb')(opts);

  return {
    create: function create(data) {
      let post = new Yamb();
      return post.update(data);
    },

    fetch: function *fetch(params, options) {
      options = options || {};
      options.limit = 1;

      if (utils.is.und(options.sort)) {
        options.sort = {created: -1};
      }

      let results = yield opts.storage.find(params, options);

      if (!results || results.length === 0) {
        return false;
      }

      let post = new Yamb(results[0]);

      return post;
    },

    fetchAll: function *fetchAll(params, options) {
      options = options || {};

      if (utils.is.und(options.sort)) {
        options.sort = {created: -1};
      }

      let results = yield opts.storage.find(params, options);

      if (!results || results.length === 0) {
        return [];
      }

      // TODO: replace Array to Map
      let posts = [], i, length = results.length;

      for (i=0; i<length; i++) {
        posts[posts.length] = new Yamb(results[i]);
      }

      return posts;
    },

    remove: function *remove(params) {
      let results = yield opts.storage.remove(params);

      // TODO: remove all related posts

      return results;
    }
  };
};