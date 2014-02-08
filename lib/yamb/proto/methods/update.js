"use strict";

var utils = require('./../../../utils');
var schema = require('./../../schema');

// yamb.prototype.update()

module.exports = function() {
  return function update(params) {
    if (!utils.is.obj(params)) {
      return this;
    }

    for (var param in params) {
      if (!params.hasOwnProperty(param) || utils.is.und(schema[param])) {
        continue;
      }

      this[param] = params[param];
    }

    return this;
  };
};