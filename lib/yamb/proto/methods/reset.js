"use strict";

var utils = require('./../../../utils');

// yamb.prototype.reset()

module.exports = function(priv) {
  return function reset() {
    for (var flag in this[priv.flags]) {
      this[priv.flags][flag] = false;
    }

    this[priv.shado] = utils.clone(this[priv.symbl]);

    var params = ['related', 'next', 'prev'];
    for (var i=0; i<params.length; i++) {
      if (this[priv.cache][params[i]]) {
        this[priv.cache][params[i]] = false;
      }
    }

    return this;
  };
};