"use strict";

// yamb.prototype.remove()

module.exports = function(symbl, flags, opts) {
  return function *remove() {
    if (!this[symbl].id) {
      // TODO: fix error message
      throw new Error('This is a new object');
    }

    let result = yield opts.storage.removeById(this.id);

    // TODO: remove all related posts

    return result;
  };
};