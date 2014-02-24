"use strict";

var utils = require('./../../../utils');

// yamb.prototype.similar()

module.exports = function(priv, opts) {
  return function *similar() {
    if (utils.empty(this.related)) {
      return [];
    }

    if (utils.is.arr(this[priv.cache].related)) {
      return this[priv.cache].related;
    }

    var posts = yield opts.storage.find({id: {$in: this.related}}, {sort: {publish: -1}});
    var related = [];

    if (!utils.empty(posts)) {
      for (var i=0, length=posts.length; i<length; i++) {
        // TODO: replace array to es6 map
        related[related.length] = new this.constructor(posts[i]);
      }
    }

    this[priv.cache].related = related;

    return related;
  };
};