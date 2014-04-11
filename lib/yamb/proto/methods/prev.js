"use strict";

var utils = require('./../../../utils');

// yamb.prototype.prev()

module.exports = function(priv, opts) {
  return function *prev(all) {
    if (!this.id) {
      return false;
    }

    all = all === true;
    var cache = 'reset_prev_' + all;

    if (utils.is.obj(this[priv.cache][cache])) {
      return this[priv.cache][cache];
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

    this[priv.cache][cache] = result;

    return result;
  };
};