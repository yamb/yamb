"use strict";

var utils = require('./../../../utils');

// yamb.prototype.text

var validate = function(value) {
  return utils.is.str(value) && !utils.whitespace(value);
};

module.exports = function(symbl, flags) {
  var setter = function(text) {
    if (!validate(text)) {
      return;
    }

    text = text.trim();

    if (!this.preview) {
      var fragments = text.split('\n\n');
      this.preview = fragments[0];
    }

    this[symbl].text = text;
    this[flags].text = true;
  };

  return {
    validate: validate,
    set: setter
  };
};