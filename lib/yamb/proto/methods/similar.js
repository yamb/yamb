"use strict";

var utils = require('./../../../utils');

// yamb.prototype.similar()

module.exports = function(priv, opts) {
  return function *similar() {
    if (this.related.length === 0) {
      return [];
    }

    if (utils.is.arr(this[priv.flags].related)) {
      return this[priv.flags].related;
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

    this[priv.flags].related = posts;

    return posts;
  };
};