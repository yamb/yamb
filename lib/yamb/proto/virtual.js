"use strict";

var utils = require('./../../utils');

function descriptors(priv, yamb, options) {
  var props = {};

  function descriptor(param) {
    return {
      enumerable: true,

      get: function() {
        return yamb[priv.symbl][options.name][param];
      },

      set: function(value) {
        if (!utils.is.str(value)) {
          return;
        }

        value = value.trim();

        yamb[priv.symbl][options.name][param] = value;
        yamb[priv.flags][options.name] = yamb[priv.shado][options.name][param] !== value;
      }
    };
  }

  for (var i=0, length=options.params.length; i<length; i++) {
    props[options.params[i]] = descriptor(options.params[i]);
  }

  return props;
}

module.exports = function(priv, options) {
  var getter = function() {
    if (!utils.is.obj(this[priv.cache][options.name])) {
      this[priv.cache][options.name] = Object.defineProperties({}, descriptors(priv, this, options));
    }

    return this[priv.cache][options.name];
  };

  var setter = function(value) {
    if (options.direct && utils.is.str(value) && !utils.whitespace(value)) {
      value = value.trim();

      this[priv.symbl][options.name][options.direct] = value;
      this[priv.flags][options.name] = this[priv.shado][options.name][options.direct] !== value;

      return;
    }

    if (!utils.is.obj(value)) {
      return;
    }

    var val;
    var changes = false;

    for (var i=0, length=options.params.length; i<length; i++) {
      if (!utils.is.str(value[options.params[i]])) {
        continue;
      }

      val = value[options.params[i]].trim();
      this[priv.symbl][options.name][options.params[i]] = val;

      if (this[priv.shado][options.name][options.params[i]] !== val) {
        changes = true;
      }
    }

    this[priv.flags][options.name] = changes;
  };

  var validate = function(value) {
    if (!utils.is.obj(value) || Object.keys(value).length !== options.params.length) {
      return false;
    }

    for (var i=0, length=options.params.length; i<length; i++) {
      if (!utils.is.str(value[options.params[i]])) {
        return false;
      }
    }

    return true;
  };

  return {
    validate: validate,
    get: getter,
    set: setter
  };
};