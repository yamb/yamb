"use strict";

const utils = require('./../../../utils'),
markdown = require('./../../engine/markdown');

// yamb.prototype.html()

module.exports = function() {
  return function html(text) {
    if (!utils.is.str(text)) {
      return false;
    }

    return markdown(text);
  };
};