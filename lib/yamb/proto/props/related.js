"use strict";

const utils = require('./../../../utils');

// yamb.prototype.related

module.exports = function(symbl) {
  let getter = function() {
    // TODO: implement getting yamb object for related
    return this[symbl].related;
  };

  let setter = function(related) {
    if (!utils.is.arr(related)) {
      related = [related];
    }

    // TODO: only unique values
    this[symbl].related = related;

    return this;
  };

  return {
    get: getter,
    set: setter
  };
};