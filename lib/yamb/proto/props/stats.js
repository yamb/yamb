"use strict";

const utils = require('./../../../utils'),

params = ['views', 'likes', 'comments'];

function descriptors(symbl, yamb) {
  let props = {};

  function descriptor(param) {
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
  }

  for (let i=0, length=params.length; i<length; i++) {
    props[params[i]] = descriptor(params[i]);
  }

  return props;
}

// yamb.prototype.stats

let validate = function(value) {
  if (!utils.is.obj(value) || Object.keys(value).length !== params.length) {
    return false;
  }

  for (let i=0, length=params.length; i<length; i++) {
    if (!utils.is.num(value[params[i]])) {
      return false;
    }
  }

  return true;
};

module.exports = function(symbl, flags) {
  let getter = function() {
    if (!utils.is.obj(this[flags].stats)) {
      this[flags].stats = Object.defineProperties({}, descriptors(symbl, this));
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
    validate: validate,
    get: getter,
    set: setter
  };
};