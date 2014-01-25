"use strict";

// yamb.prototype.remove()

module.exports = function(symbl, flags, opts) {
  return function *remove() {
    if (!this.id) {
      // TODO: fix error message
      throw new Error('This is a new object');
    }

    let oid = '' + this.id;
    yield opts.storage.update({related: oid}, {$pull: {related: oid}});

    let result = yield opts.storage.removeById(this.id);

    return result;
  };
};