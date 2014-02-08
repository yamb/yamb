"use strict";

// yamb.prototype.id

module.exports = function(symbl) {
  var getter = function() {
    if (!this[symbl].id) {
      return false;
    }

    return this[symbl].id;
  };

  return {
    get: getter,
    set: false
  };
};