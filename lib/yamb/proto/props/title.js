"use strict";

var utils = require('./../../../utils');

// yamb.prototype.title

var validate = function(value) {
  return utils.is.str(value) && !utils.whitespace(value);
};

module.exports = function(priv) {
  var setter = function(title) {
    if (!validate(title)) {
      return;
    }

    title = title.trim();

    this[priv.symbl].title = title;
    this[priv.flags].title = this[priv.shado].title !== title;
  };

  return {
    validate: validate,
    set: setter
  };
};