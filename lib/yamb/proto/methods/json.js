"use strict";

const utils = require('./../../../utils');

// yamb.prototype.json()

module.exports = function(symbl) {
  return function json() {
    return utils.clone(this[symbl]);
  };
};