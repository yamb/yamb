"use strict";

const utils = require('./../../../utils');

// yamb.prototype.title

let validate = function(value) {
  return utils.is.str(value);
};

module.exports = function(symbl, flags) {
  let setter = function(title) {
    if (!validate(title)) {
      return this;
    }

    this[symbl].title = utils.stringify(title);
    this[flags].title = true;

    return this;
  };

  return {
    validate: validate,
    set: setter
  };
};