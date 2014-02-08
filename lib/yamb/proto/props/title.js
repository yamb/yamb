"use strict";

var utils = require('./../../../utils');

// yamb.prototype.title

var validate = function(value) {
  return utils.is.str(value) && !utils.whitespace(value);
};

module.exports = function(symbl, flags) {
  var setter = function(title) {
    if (!validate(title)) {
      return;
    }

    this[symbl].title = title.trim();
    this[flags].title = true;
  };

  return {
    validate: validate,
    set: setter
  };
};