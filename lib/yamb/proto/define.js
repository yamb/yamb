"use strict";

var utils = require('./../../utils');

function define(name, prop, priv) {
  var descriptor = {enumerable: true};

  var getter = prop.get;
  var setter = prop.set;

  if (getter !== false) {
    if (!utils.is.fun(getter) && getter !== false) {
      getter = function() {
        return this[priv.symbl][name];
      };
    }

    descriptor.get = getter;
  }

  if (setter !== false) {
    if (!utils.is.fun(setter)) {
      setter = function(value) {
        this[priv.symbl][name] = value;
        this[priv.flags][name] = this[priv.shado][name] !== value;
      };
    }

    descriptor.set = setter;
  }

  return descriptor;
}

module.exports = function(priv) {
  return function(name, prop) {
    return define(name, prop, priv);
  };
};