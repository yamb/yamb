"use strict";

var utils = require('./../../../utils');

// yamb.prototype.next()

module.exports = function(priv, opts) {
  return function *next(all) {
    if (!this.id) {
      return false;
    }

    if (utils.is.obj(this[priv.cache].next)) {
      return this[priv.cache].next;
    }

    var params = {active: true, publish: {$gt: this.publish}};
    var options = {limit: 1, sort: {publish: 1}};

    if (all === true) {
      params = {created: {$gt: this.created}};
      options.sort = {created: 1};
    }

    var posts = yield opts.storage.find(params, options);
    var result = false;

    if (!utils.empty(posts)) {
      result = new this.constructor(posts[0]);
    }

    this[priv.cache].next = result;

    return result;
  };
};