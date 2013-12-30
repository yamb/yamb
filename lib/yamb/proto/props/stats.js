"use strict";

const utils = require('./../../../utils'),

params = ['views', 'likes', 'comments'];

function define(symbl, yamb) {
  let descriptors = {};

  let descriptor = function(param) {
    return {
      enumerable: true,

      get: function() {
        return yamb[symbl].stats[param];
      },

      set: function(value) {
        if (!utils.is.num(value) && !utils.is.str(value)) {
          return;
        }

        value = parseInt(value, 10) || 0;
        yamb[symbl].stats[param] = value;
      }
    };
  };

  for (let i=0, length=params.length; i<length; i++) {
    descriptors[params[i]] = descriptor(params[i]);
  }

  return descriptors;
}

// yamb.prototype.stats

module.exports = function(symbl, flags) {
  let getter = function() {
    if (!utils.is.obj(this[flags].stats)) {
      this[flags].stats = Object.defineProperties({}, define(symbl, this));
    }

    return this[flags].stats;
  };

  let setter = function(value) {
    if (!utils.is.obj(value)) {
      return;
    }

    for (let i=0, length=params.length; i<length; i++) {
      if (!utils.is.num(value[params[i]]) && !utils.is.str(value[params[i]])) {
        continue;
      }

      this[symbl].stats[params[i]] = parseInt(value[params[i]], 10) || 0;
    }
  };

  return {
    get: getter,
    set: setter
  };
};