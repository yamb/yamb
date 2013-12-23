"use strict";

const utils = require('./../../../utils');

// yamb.prototype.text

let validate = function(value) {
  return utils.is.str(value);
};

module.exports = function(symbl, flags) {
  let setter = function(text) {
    if (!validate(text)) {
      return this;
    }

    text = utils.stringify(text);

    if (!this.preview) {
      let fragments = text.split('\n\n');
      this.preview = fragments.shift();

      text = utils.stringify(fragments.join('\n\n'));
    }

    this[symbl].text = text;
    this[flags].text = true;

    return this;
  };

  return {
    validate: validate,
    set: setter
  };
};