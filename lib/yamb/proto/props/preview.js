"use strict";

var utils = require('./../../../utils');

// yamb.prototype.preview

var validate = function(value) {
  return utils.is.str(value) && !utils.whitespace(value);
};

module.exports = function(priv) {
  var setter = function(text) {
    if (!validate(text)) {
      return;
    }

    this[priv.symbl].preview = text.trim();
    this[priv.flags].preview = true;
  };

  return {
    validate: validate,
    set: setter
  };
};