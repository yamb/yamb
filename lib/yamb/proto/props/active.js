"use strict";

var utils = require('./../../../utils');

// yamb.prototype.active

var validate = function(value) {
  return utils.is.bool(value);
};

module.exports = function(symbl) {
  var setter = function(active) {
    if (!validate(active) && active !== 'Y' && active !== 'N') {
      return;
    }

    if (utils.is.str(active)) {
      active = active === 'Y';
    }

    this[symbl].active = active;
  };

  return {
    validate: validate,
    set: setter
  };
};