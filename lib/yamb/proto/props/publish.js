"use strict";

var utils = require('./../../../utils');

// yamb.prototype.publish

var validate = function(value) {
  return utils.is.date(value) || (utils.is.str(value) && utils.is.date(new Date(value)));
};

module.exports = function(symbl) {
  var getter = function() {
    var date = this[symbl].publish;

    if (!date) {
      return false;
    }

    if (utils.is.str(date)) {
      this[symbl].publish = new Date(date);
    }

    return this[symbl].publish;
  };

  var setter = function(value) {
    if (!validate(value)) {
      return;
    }

    if (utils.is.str(value)) {
      value = new Date(value);
    }

    this[symbl].publish = value;
  };

  return {
    validate: validate,
    get: getter,
    set: setter
  };
};