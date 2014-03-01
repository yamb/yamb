"use strict";

var utils = require('./../../../utils');

// yamb.prototype.next()

module.exports = function(priv, opts) {
  return function *next() {
    if (!this.id) {
      return false;
    }

    if (utils.is.obj(this[priv.cache].next)) {
      return this[priv.cache].next;
    }

    var posts = yield opts.storage.find({publish: {$gt: this.publish}}, {limit: 1, sort: {publish: 1}});
    var next = false;

    if (!utils.empty(posts)) {
      next = new this.constructor(posts[0]);
    }

    this[priv.cache].next = next;

    return next;
  };
};