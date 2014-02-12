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

    text = text.trim();

    this[priv.symbl].preview = text;
    this[priv.flags].preview = this[priv.shado].preview !== text;
  };

  return {
    validate: validate,
    set: setter
  };
};