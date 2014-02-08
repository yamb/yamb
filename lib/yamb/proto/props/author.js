"use strict";

var utils = require('./../../../utils');
var params = ['name', 'email', 'url'];

function descriptors(symbl, yamb) {
  var props = {};

  function descriptor(param) {
    return {
      enumerable: true,

      get: function() {
        return yamb[symbl].author[param];
      },

      set: function(value) {
        if (!utils.is.str(value)) {
          return;
        }

        yamb[symbl].author[param] = value.trim();
      }
    };
  }

  for (var i=0, length=params.length; i<length; i++) {
    props[params[i]] = descriptor(params[i]);
  }

  return props;
}

// yamb.prototype.author

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

module.exports = function(symbl, flags) {
  var getter = function() {
    if (!utils.is.obj(this[flags].author)) {
      this[flags].author = Object.defineProperties({}, descriptors(symbl, this));
    }

    return this[flags].author;
  };

  var setter = function(value) {
    if (utils.is.str(value) && !utils.whitespace(value)) {
      this[symbl].author.name = value.trim();
      return;
    }

    if (!utils.is.obj(value)) {
      return;
    }

    for (var i=0, length=params.length; i<length; i++) {
      if (!utils.is.str(value[params[i]])) {
        continue;
      }

      this[symbl].author[params[i]] = value[params[i]].trim();
    }
  };

  return {
    validate: validate,
    get: getter,
    set: setter
  };
};