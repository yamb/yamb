"use strict";

const utils = require('./../../../utils');

// yamb.prototype.tags

let validate = function(value) {
  return utils.is.arr(value) || (utils.is.str(value) && !utils.whitespace(value));
};

module.exports = function(symbl) {
  let setter = function(tags) {
    if (!validate(tags)) {
      return;
    }

    if (utils.is.str(tags)) {
      let arr = [], tag;
      tags = tags.split(',');

      for (let i=0, length=tags.length; i<length; i++) {
        tag = utils.stringify(tags[i]);
        if (utils.whitespace(tag)) {
          continue;
        }

        arr[arr.length] = tag;
      }

      tags = arr;
    }

    this[symbl].tags = tags;
  };

  return {
    validate: validate,
    set: setter
  };
};