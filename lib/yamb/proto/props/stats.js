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
        yamb[priv.flags].stats = yamb[priv.shado].stats[param] !== value;
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
    if (!utils.is.obj(this[priv.cache].stats)) {
      this[priv.cache].stats = Object.defineProperties({}, descriptors(priv, this));
    }

    return this[priv.cache].stats;
  };

  var setter = function(value) {
    if (!utils.is.obj(value)) {
      return;
    }

    var val;
    var changes = false;

    for (var i=0, length=params.length; i<length; i++) {
      if (!utils.is.num(value[params[i]]) && !utils.is.str(value[params[i]])) {
        continue;
      }

      val = parseInt(value[params[i]], 10) || 0;
      this[priv.symbl].stats[params[i]] = val;

      if (this[priv.shado].stats[params[i]] !== val) {
        changes = true;
      }
    }

    this[priv.flags].stats = changes;
  };

  return {
    validate: validate,
    get: getter,
    set: setter
  };
};