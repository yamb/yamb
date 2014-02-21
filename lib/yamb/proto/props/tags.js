"use strict";

var utils = require('./../../../utils');

// yamb.prototype.tags

var validate = function(value) {
  return utils.is.arr(value);
};

module.exports = function(priv) {
  var getter = function() {
    return utils.clone(this[priv.symbl].tags);
  };

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
      tag = utils.striptags(tag);

      if (utils.whitespace(tag)) {
        continue;
      }

      arr[arr.length] = tag;
    }

    this[priv.symbl].tags = arr;
    this[priv.flags].tags = !utils.compare(this[priv.shado].tags, arr);
  };

  return {
    validate: validate,
    get: getter,
    set: setter
  };
};