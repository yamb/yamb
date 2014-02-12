"use strict";

var util = require('util');

exports.is = {
  fun: util.isFunction,
  arr: util.isArray,
  obj: util.isObject,
  str: util.isString,
  bool: util.isBoolean,
  und: util.isUndefined,

  num: function(n) {
    return util.isNumber(n) && !isNaN(n);
  },

  date: function(d) {
    return util.isDate(d) && !isNaN(d);
  },

  exst: function(o) {
    return !util.isUndefined(o) && o !== null;
  },

  yamb: function(o) {
    if (!util.isObject(o) || !o.constructor) {
      return false;
    }

    return o.constructor.name && o.constructor.name === 'Yamb';
  }
};

exports.clone = require('clone');

var stringify = exports.stringify = function(string) {
  return ('' + string).trim();
};

exports.whitespace = function(string) {
  var regex = /^[\s]*$/;
  return regex.test(stringify(string));
};

exports.pad = function(num) {
  if (num < 10) {
    return '0' + num;
  } else {
    return num;
  }
};

exports.compare = function(a1, a2) {
  if (!util.isArray(a1) || !util.isArray(a2)) {
    return false;
  }

  if (a1.length !== a2.length) {
    return false;
  }

  for (var i=0, length=a1.length; i<length; i++) {
    if (a1[i] !== a2[i]) {
      return false;
    }
  }

  return true;
}