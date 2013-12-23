"use strict";

// yamb.prototype.uri

function pad(num) {
  if (num < 10) {
    return '0' + num;
  } else {
    return num;
  }
}

module.exports = function() {
  let getter = function() {
    if (!this.slug) {
      // TODO: fix error message
      throw new Error('Slug not exists');
    }

    let uri = [
      this.created.getFullYear(),
      pad(this.created.getMonth() + 1),
      this.slug
    ];

    return '/' + uri.join('/');
  };

  return {
    get: getter,
    set: false
  };
};