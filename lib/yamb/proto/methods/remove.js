"use strict";

// yamb.prototype.remove()

module.exports = function(priv, opts) {
  return function *remove() {
    if (!this.id) {
      // TODO: fix error message
      throw new Error('This is a new object');
    }

    var oid = '' + this.id;
    yield opts.storage.update({related: oid}, {$pull: {related: oid}});

    var result = yield opts.storage.removeById(this.id);

    return result;
  };
};