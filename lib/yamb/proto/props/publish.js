"use strict";

var utils = require('./../../../utils');

// yamb.prototype.publish

var validate = function(value) {
  return utils.is.date(value) || (utils.is.str(value) && utils.is.date(new Date(value)));
};

module.exports = function(priv) {
  var getter = function() {
    var date = this[priv.symbl].publish;

    if (!date) {
      return false;
    }

    if (utils.is.str(date)) {
      this[priv.symbl].publish = new Date(date);
    }

    return this[priv.symbl].publish;
  };

  var setter = function(value) {
    if (!validate(value)) {
      return;
    }

    if (utils.is.str(value)) {
      value = new Date(value);
    }

    this[priv.symbl].publish = value;
  };

  return {
    validate: validate,
    get: getter,
    set: setter
  };
};