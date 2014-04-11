"use strict";

var utils = require('./../../../utils');

// yamb.prototype.similar()

module.exports = function(priv, opts) {
  return function *similar(all) {
    if (!this.id || utils.empty(this.related)) {
      return [];
    }

    all = all === true;
    var cache = 'reset_related_' + all;

    if (utils.is.arr(this[priv.cache][cache])) {
      return this[priv.cache][cache];
    }

    var params = {id: {$in: this.related}};
    if (all !== true) {
      params.active = true;
    }

    var posts = yield opts.storage.find(params, {sort: {publish: -1}});
    var related = [];

    if (!utils.empty(posts)) {
      for (var i=0, length=posts.length; i<length; i++) {
        // TODO: replace array to es6 map
        related[related.length] = new this.constructor(posts[i]);
      }
    }

    this[priv.cache][cache] = related;

    return related;
  };
};