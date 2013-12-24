"use strict";

const co = require('co'),
utils = require('./../../../utils');

// yamb.prototype.remove()

module.exports = function(symbl, flags, opts) {
  return function remove(fn) {
    if (!utils.is.fun(fn)) {
      fn = function() {};
    }

    if (!this[symbl].id) {
      // TODO: fix error message
      let error = new Error('This is a new object');
      fn(error, false);

      return;
    }

    co(function *(oid) {
      let result = yield opts.storage.removeById(opts.dbname, oid);

      // TODO: remove all related posts

      return result;
    })(this.id, fn);
  };
};