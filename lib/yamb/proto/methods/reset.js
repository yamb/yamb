"use strict";

var utils = require('./../../../utils');

// yamb.prototype.reset()

module.exports = function(priv) {
  return function reset() {
    for (var flag in this[priv.flags]) {
      this[priv.flags][flag] = false;
    }

    this[priv.shado] = utils.clone(this[priv.symbl]);

    for (var key in this[priv.cache]) {
      if (key.indexOf('reset_') > -1) {
        this[priv.cache][key] = false;
      }
    }

    return this;
  };
};