"use strict";

var utils = require('./../../../utils');

// yamb.prototype.cover

var validate = function(value) {
  return utils.is.str(value) && !utils.whitespace(value);
};

module.exports = function(priv) {
  var setter = function(image) {
    if (!utils.is.str(image)) {
      return;
    }

    image = utils.striptags(image.trim());

    if (utils.whitespace(image)) {
      return;
    }

    this[priv.symbl].cover = image;
    this[priv.flags].cover = this[priv.shado].cover !== image;
  };

  return {
    validate: validate,
    set: setter
  };
};