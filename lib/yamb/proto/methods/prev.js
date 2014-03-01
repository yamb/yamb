"use strict";

var utils = require('./../../../utils');

// yamb.prototype.prev()

module.exports = function(priv, opts) {
  return function *prev() {
    if (!this.id) {
      return false;
    }

    if (utils.is.obj(this[priv.cache].prev)) {
      return this[priv.cache].prev;
    }

    var posts = yield opts.storage.find({publish: {$lt: this.publish}}, {limit: 1, sort: {publish: -1}});
    var prev = false;

    if (!utils.empty(posts)) {
      prev = new this.constructor(posts[0]);
    }

    this[priv.cache].prev = prev;

    return prev;
  };
};