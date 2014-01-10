"use strict";

module.exports = function(opts) {
  opts.dbname = opts.dbname || 'yamb';

  if (!opts.storage) {
    // TODO: fix error message
    throw new Error('error with storage');
  }

  const Yamb = require('./yamb')(opts);

  return {
    create: function(data) {
      let post = new Yamb();
      return post.update(data);
    },

    fetch: function *fetch(params, options) {
      options = options || {};
      options.limit = 1;

      let results = yield opts.storage.find(opts.dbname, params, options);

      if (!results || results.length === 0) {
        return false;
      }

      let post = new Yamb(results[0]);

      return post;
    },

    fetchAll: function *fetchAll(params, options) {
      let results = yield opts.storage.find(opts.dbname, params, options);

      if (!results || results.length === 0) {
        return false;
      }

      // TODO: replace Array to Map
      let posts = [], post, i, length = results.length;

      for (i=0; i<length; i++) {
        post = new Yamb(results[i]);
        posts.push(post);
      }

      return posts;
    },

    remove: function *remove(params) {
      let results = yield opts.storage.remove(opts.dbname, params);

      // TODO: remove all related posts

      return results;
    }
  };
};