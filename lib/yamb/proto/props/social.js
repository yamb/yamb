"use strict";

var utils = require('./../../../utils');
var params = ['title', 'description', 'image', 'cover'];

function descriptors(priv, yamb) {
  var props = {};

  function descriptor(param) {
    return {
      enumerable: true,

      get: function() {
        return yamb[priv.symbl].social[param];
      },

      set: function(value) {
        if (!utils.is.str(value)) {
          return;
        }

        value = value.trim();

        yamb[priv.symbl].social[param] = value;
        yamb[priv.flags].social = yamb[priv.shado].social[param] !== value;
      }
    };
  }

  for (var i=0, length=params.length; i<length; i++) {
    props[params[i]] = descriptor(params[i]);
  }

  return props;
}

// yamb.prototype.social

var validate = function(value) {
  if (!utils.is.obj(value) || Object.keys(value).length !== params.length) {
    return false;
  }

  for (var i=0, length=params.length; i<length; i++) {
    if (!utils.is.str(value[params[i]])) {
      return false;
    }
  }

  return true;
};

module.exports = function(priv) {
  var getter = function() {
    if (!utils.is.obj(this[priv.cache].social)) {
      this[priv.cache].social = Object.defineProperties({}, descriptors(priv, this));
    }

    return this[priv.cache].social;
  };

  var setter = function(value) {
    if (!utils.is.obj(value)) {
      return;
    }

    var val;
    var changes = false;

    for (var i=0, length=params.length; i<length; i++) {
      if (!utils.is.str(value[params[i]])) {
        continue;
      }

      val = value[params[i]].trim();
      this[priv.symbl].social[params[i]] = val;

      if (this[priv.shado].social[params[i]] !== val) {
        changes = true;
      }
    }

    this[priv.flags].social = changes;
  };

  return {
    validate: validate,
    get: getter,
    set: setter
  };
};