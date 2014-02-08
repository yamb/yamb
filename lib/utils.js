"use strict";

var util = require('util');
var clone = require('clone');

var stringify = function(string) {
  return ('' + string).trim();
};

var whitespace = function(string) {
  var regex = /^[\s]*$/;
  return regex.test(stringify(string));
};

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

exports.clone = clone;

exports.stringify = stringify;
exports.whitespace = whitespace;