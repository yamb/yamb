"use strict";

const utils = require('./../../../utils');

// yamb.prototype.preview

let validate = function(value) {
  return utils.is.str(value);
};

module.exports = function(symbl, flags) {
  let setter = function(text) {
    if (!validate(text)) {
      return;
    }

    this[symbl].preview = utils.stringify(text);
    this[flags].preview = true;
  };

  return {
    validate: validate,
    set: setter
  };
};