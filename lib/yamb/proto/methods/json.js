"use strict";

var utils = require('./../../../utils');

// yamb.prototype.json()

module.exports = function(priv) {
  return function json(newer) {
    var data = utils.clone(this[priv.symbl]);

    if (newer === true) {
      var updated = {};

      for (var flag in this[priv.flags]) {
        if (this[priv.flags][flag] === true) {
          updated[flag] = data[flag];
        }
      }

      data = updated;
    }

    return data;
  };
};