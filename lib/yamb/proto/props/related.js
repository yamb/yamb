"use strict";

const utils = require('./../../../utils');

// yamb.prototype.related

let validate = function(value) {
  if (!utils.is.arr(value)) {
    return false;
  }

  for (let i=0, length=value.length; i<length; i++) {
    if (!suppose(value[i])) {
      return false;
    }
  }

  return true;
},

suppose = function(value) {
  return utils.is.str(value) || utils.is.num(value);
};

module.exports = function(symbl, flags) {
  let facility = function(relate) {
    return utils.is.yamb(relate) && relate[symbl].id;
  };

  let getter = function() {
    return this[symbl].related;
  };

  let setter = function(related) {
    if (!utils.is.arr(related) && !suppose(related) && !facility(related)) {
      return;
    }

    if (utils.is.arr(related)) {
      let data = [], i, length = related.length;

      for (i=0; i<length; i++) {
        if (suppose(related[i])) {
          data[data.length] = related[i];
        } else if (facility(related[i])) {
          data[data.length] = related[i].id;
        }
      }

      related = data;
    } else if (suppose(related)) {
      related = [related];
    } else {
      related = facility(related) ? [related.id] : [];
    }

    this[flags].related = false;
    this[symbl].related = related;
  };

  return {
    validate: validate,
    get: getter,
    set: setter
  };
};