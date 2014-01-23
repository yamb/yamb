"use strict";

// yamb.prototype.similar()

module.exports = function(symbl, flags, opts) {
  return function *similar() {
    if (this.related.length === 0) {
      return [];
    }

    let related = yield opts.storage.find({
      id: {$in: this.related}
    }, {
      sort: {created: -1}
    });

    if (!related || related.length === 0) {
      return [];
    }

    // TODO: replace Array to Map
    let posts = [], i, length = related.length;

    for (i=0; i<length; i++) {
      posts[posts.length] = new this.constructor(related[i]);
    }

    return posts;
  };
};