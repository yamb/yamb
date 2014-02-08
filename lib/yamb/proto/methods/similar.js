"use strict";

var utils = require('./../../../utils');

// yamb.prototype.similar()

module.exports = function(symbl, flags, opts) {
  return function *similar() {
    if (this.related.length === 0) {
      return [];
    }

    if (utils.is.arr(this[flags].related)) {
      return this[flags].related;
    }

    var related = yield opts.storage.find({
      id: {$in: this.related}
    }, {
      sort: {created: -1}
    });

    if (!related || related.length === 0) {
      return [];
    }

    // TODO: replace Array to Map
    var posts = [];

    for (var i=0, length=related.length; i<length; i++) {
      posts[posts.length] = new this.constructor(related[i]);
    }

    this[flags].related = posts;

    return posts;
  };
};