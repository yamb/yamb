"use strict";

var utils = require('./../../../utils');

// yamb.prototype.json()

module.exports = function(priv) {
  return function json() {
    return utils.clone(this[priv.symbl]);
  };
};