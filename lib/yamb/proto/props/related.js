"use strict";

const utils = require('./../../../utils');

// yamb.prototype.related

let validate = function(value) {
  return utils.is.yamb(value) || utils.is.str(value) || utils.is.num(value);
},

suppose = function(value) {
  return utils.is.arr(value) || validate(value);
};

module.exports = function(symbl) {
  let getter = function() {
    return this[symbl].related;
  };

  let setter = function(related) {
    if (!suppose(related)) {
      return;
    }

    if (utils.is.arr(related)) {
      let data = [], i, length = related.length;

      for (i=0; i<length; i++) {
        if (!validate(related[i])) {
          continue;
        }

        data.push(related[i]);
      }

      related = data;
    } else {
      related = [related];
    }

    this[symbl].related = related;
  };

  return {
    validate: suppose,
    get: getter,
    set: setter
  };
};