"use strict";

const utils = require('./../../../utils');

// yamb.prototype.tags

let validate = function(value) {
  return utils.is.arr(value) || utils.is.str(value);
};

module.exports = function(symbl) {
  let setter = function(tags) {
    if (!validate(tags)) {
      return;
    }

    if (utils.is.str(tags)) {
      tags = tags.split(',');
    }

    let arr = [], tag;

    for (let i=0, length=tags.length; i<length; i++) {
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