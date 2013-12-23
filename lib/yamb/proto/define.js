"use strict";

const utils = require('./../../utils');

function define(name, prop, symbl) {
  let descriptor = {enumerable: true},

  getter = prop.get,
  setter = prop.set;

  if (getter !== false) {
    if (!utils.is.fun(getter) && getter !== false) {
      getter = function() {
        return this[symbl][name];
      };
    }

    descriptor.get = getter;
  }

  if (setter !== false) {
    if (!utils.is.fun(setter)) {
      setter = function(value) {
        if (value) {
          this[symbl][name] = value;
        }
        return this;
      };
    }

    descriptor.set = setter;
  }

  return descriptor;
}

module.exports = function(symbl) {
  return function(name, prop) {
    return define(name, prop, symbl);
  };
};