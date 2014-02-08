"use strict";

var utils = require('./../../../utils');

// yamb.prototype.preview

var validate = function(value) {
  return utils.is.str(value) && !utils.whitespace(value);
};

module.exports = function(symbl, flags) {
  var setter = function(text) {
    if (!validate(text)) {
      return;
    }

    this[symbl].preview = text.trim();
    this[flags].preview = true;
  };

  return {
    validate: validate,
    set: setter
  };
};