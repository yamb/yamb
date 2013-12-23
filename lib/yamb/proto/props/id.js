"use strict";

// yamb.prototype.id

module.exports = function(symbl) {
  let getter = function() {
    if (!this[symbl].id) {
      // TODO: fix error message
      throw new Error('This is a new object');
    }

    return this[symbl].id;
  };

  return {
    get: getter,
    set: false
  };
};