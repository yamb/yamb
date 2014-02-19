"use strict";

var utils = require('./utils');

module.exports = function(opts) {
  if (!opts.storage) {
    // TODO: fix error message
    throw new Error('error with storage');
  }

  var Yamb = require('./yamb')(opts);

  return {
    create: function create(data) {
      var post = new Yamb();
      return post.update(data);
    },

    fetch: function *fetch(params, options) {
      options = options || {};
      options.limit = 1;

      if (utils.is.und(options.sort)) {
        options.sort = {created: -1};
      }

      var results = yield opts.storage.find(params, options);
      if (utils.empty(results)) {
        return false;
      }

      var post = new Yamb(results[0]);

      return post;
    },

    fetchAll: function *fetchAll(params, options) {
      options = options || {};

      if (utils.is.und(options.sort)) {
        options.sort = {created: -1};
      }

      var results = yield opts.storage.find(params, options);
      if (utils.empty(results)) {
        return [];
      }

      var posts = []; // TODO: replace array to es6 map
      for (var i=0, length=results.length; i<length; i++) {
        posts[posts.length] = new Yamb(results[i]);
      }

      return posts;
    },

    remove: function *remove(params) {
      var results = yield opts.storage.remove(params);

      // TODO: remove all related posts

      return results;
    }
  };
};