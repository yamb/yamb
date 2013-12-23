"use strict";

const utils = require('./../../../utils');

// yamb.prototype.active

let validate = function(value) {
  return utils.is.bool(value);
};

module.exports = function(symbl) {
  let setter = function(active) {
    if (!validate(active)) {
      return this;
    }

    this[symbl].active = active;

    return this;
  };

  return {
    validate: validate,
    set: setter
  };
};