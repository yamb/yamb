"use strict";

var utils = require('./../../../utils');
var params = ['views', 'likes', 'comments'];

function descriptors(priv, yamb) {
  var props = {};

  function descriptor(param) {
    return {
      enumerable: true,

      get: function() {
        return yamb[priv.symbl].stats[param];
      },

      set: function(value) {
        if (!utils.is.num(value) && !utils.is.str(value)) {
          return;
        }

        value = parseInt(value, 10) || 0;
        yamb[priv.symbl].stats[param] = value;
      }
    };
  }

  for (var i=0, length=params.length; i<length; i++) {
    props[params[i]] = descriptor(params[i]);
  }

  return props;
}

// yamb.prototype.stats

var validate = function(value) {
  if (!utils.is.obj(value) || Object.keys(value).length !== params.length) {
    return false;
  }

  for (var i=0, length=params.length; i<length; i++) {
    if (!utils.is.num(value[params[i]])) {
      return false;
    }
  }

  return true;
};

module.exports = function(priv) {
  var getter = function() {
    if (!utils.is.obj(this[priv.flags].stats)) {
      this[priv.flags].stats = Object.defineProperties({}, descriptors(priv, this));
    }

    return this[priv.flags].stats;
  };

  var setter = function(value) {
    if (!utils.is.obj(value)) {
      return;
    }

    for (var i=0, length=params.length; i<length; i++) {
      if (!utils.is.num(value[params[i]]) && !utils.is.str(value[params[i]])) {
        continue;
      }

      this[priv.symbl].stats[params[i]] = parseInt(value[params[i]], 10) || 0;
    }
  };

  return {
    validate: validate,
    get: getter,
    set: setter
  };
};