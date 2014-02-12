"use strict";

var utils = require('./../../../utils');

// yamb.prototype.related

var suppose = function(value) {
  return (utils.is.str(value) && !utils.whitespace(value)) || utils.is.num(value);
};

var validate = function(value) {
  if (!utils.is.arr(value)) {
    return false;
  }

  for (var i=0, length=value.length; i<length; i++) {
    if (!suppose(value[i])) {
      return false;
    }
  }

  return true;
};

module.exports = function(priv) {
  var facility = function(relate) {
    return utils.is.yamb(relate) && relate[priv.symbl].id;
  };

  var getter = function() {
    return utils.clone(this[priv.symbl].related);
  };

  var setter = function(related) {
    if (!utils.is.arr(related) && !suppose(related) && !facility(related)) {
      return;
    }

    if (utils.is.arr(related)) {
      var data = [];

      for (var i=0, length=related.length; i<length; i++) {
        if (suppose(related[i])) {
          data[data.length] = related[i];
        } else if (facility(related[i])) {
          data[data.length] = related[i].id;
        }
      }

      related = data;
    } else if (suppose(related)) {
      related = [related];
    } else {
      related = facility(related) ? [related.id] : [];
    }

    this[priv.flags].related = false;
    this[priv.symbl].related = related;
  };

  return {
    validate: validate,
    get: getter,
    set: setter
  };
};