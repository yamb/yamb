"use strict";

let util = require('util'),
clone = require('clone'),

titlecase = function(string) {
  return string.charAt(0).toUpperCase() + string.substr(1);
},

stringify = function(string) {
  return ('' + string).trim();
},

whitespace = function(string) {
  let regex = /^[\s]*$/;
  return regex.test(stringify(string));
};

exports.is = {
  fun: util.isFunction,
  arr: util.isArray,
  obj: util.isObject,
  str: util.isString,
  date: function(d) {
    return util.isDate(d) && !isNaN(d);
  },
  bool: util.isBoolean,
  und: util.isUndefined,
  exst: function(o) {
    return !util.isUndefined(o) && o !== null;
  }
};

exports.clone = clone;

exports.titlecase = titlecase;
exports.stringify = stringify;
exports.whitespace = whitespace;