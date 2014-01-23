"use strict";

const utils = require('./../../../utils');

// yamb.prototype.text

let validate = function(value) {
  return utils.is.str(value) && !utils.whitespace(value);
};

module.exports = function(symbl, flags) {
  let setter = function(text) {
    if (!validate(text)) {
      return;
    }

    text = utils.stringify(text);

    if (!this.preview) {
      let fragments = text.split('\n\n');
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