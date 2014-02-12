"use strict";

var utils = require('./../../../utils');

// yamb.prototype.reset()

module.exports = function(priv) {
  return function reset() {
    for (var flag in this[priv.flags]) {
      this[priv.flags][flag] = false;
    }

    this[priv.shado] = utils.clone(this[priv.symbl]);

    if (this[priv.cache].related) {
      this[priv.cache].related = false;
    }

    return this;
  };
};