"use strict";

const utils = require('./../../../utils');

// yamb.prototype.tags

let validate = function(value) {
  return utils.is.arr(value) || utils.is.str(value);
};

module.exports = function(symbl) {
  let setter = function(tags) {
    if (!validate(tags)) {
      return;
    }

    if (utils.is.str(tags)) {
      tags = [tags];
    }

    this[symbl].tags = tags;
  };

  return {
    validate: validate,
    set: setter
  };
};