"use strict";

// yamb.prototype.id

module.exports = function(priv) {
  var getter = function() {
    if (!this[priv.symbl].id) {
      return false;
    }

    return this[priv.symbl].id;
  };

  return {
    get: getter,
    set: false
  };
};