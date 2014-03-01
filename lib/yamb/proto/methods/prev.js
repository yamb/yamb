"use strict";

var utils = require('./../../../utils');

// yamb.prototype.prev()

module.exports = function(priv, opts) {
  return function *prev(all) {
    if (!this.id) {
      return false;
    }

    if (utils.is.obj(this[priv.cache].prev)) {
      return this[priv.cache].prev;
    }

    var params = {active: true, publish: {$lt: this.publish}};
    var options = {limit: 1, sort: {publish: -1}};

    if (all === true) {
      params = {created: {$lt: this.created}};
      options.sort = {created: -1};
    }

    var posts = yield opts.storage.find(params, options);
    var result = false;

    if (!utils.empty(posts)) {
      result = new this.constructor(posts[0]);
    }

    this[priv.cache].prev = result;

    return result;
  };
};