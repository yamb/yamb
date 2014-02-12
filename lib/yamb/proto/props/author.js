"use strict";

var utils = require('./../../../utils');
var params = ['name', 'email', 'url'];

function descriptors(priv, yamb) {
  var props = {};

  function descriptor(param) {
    return {
      enumerable: true,

      get: function() {
        return yamb[priv.symbl].author[param];
      },

      set: function(value) {
        if (!utils.is.str(value)) {
          return;
        }

        value = value.trim();

        yamb[priv.symbl].author[param] = value;
        yamb[priv.flags].author = yamb[priv.shado].author[param] !== value;
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

module.exports = function(priv) {
  var getter = function() {
    if (!utils.is.obj(this[priv.cache].author)) {
      this[priv.cache].author = Object.defineProperties({}, descriptors(priv, this));
    }

    return this[priv.cache].author;
  };

  var setter = function(value) {
    if (utils.is.str(value) && !utils.whitespace(value)) {
      value = value.trim();

      this[priv.symbl].author.name = value;
      this[priv.flags].author = this[priv.shado].author.name !== value;

      return;
    }

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
      this[priv.symbl].author[params[i]] = val;

      if (this[priv.shado].author[params[i]] !== val) {
        changes = true;
      }
    }

    this[priv.flags].author = changes;
  };

  return {
    validate: validate,
    get: getter,
    set: setter
  };
};