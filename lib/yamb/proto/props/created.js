"use strict";

var utils = require('./../../../utils');

// yamb.prototype.created

var validate = function(value) {
  return utils.is.date(value) || (utils.is.str(value) && utils.is.date(new Date(value)));
};

module.exports = function(symbl) {
  var getter = function() {
    var date = this[symbl].created;

    if (utils.is.str(date)) {
      this[symbl].created = new Date(date);
    }

    return this[symbl].created;
  };

  return {
    validate: validate,
    get: getter,
    set: false
  };
};