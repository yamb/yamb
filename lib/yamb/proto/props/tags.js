"use strict";

var utils = require('./../../../utils');

// yamb.prototype.tags

var validate = function(value) {
  return utils.is.arr(value);
};

module.exports = function(symbl) {
  var setter = function(tags) {
    if (!validate(tags) && !utils.is.str(tags)) {
      return;
    }

    if (utils.is.str(tags)) {
      tags = tags.split(',');
    }

    var arr = [];
    var tag;

    for (var i=0, length=tags.length; i<length; i++) {
      tag = utils.stringify(tags[i]);
      if (utils.whitespace(tag)) {
        continue;
      }

      arr[arr.length] = tag;
    }

    this[symbl].tags = arr;
  };

  return {
    validate: validate,
    set: setter
  };
};