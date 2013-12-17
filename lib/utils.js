"use strict";

let fun = function(f) {
  return typeof f === 'function';
},

arr = function(a) {
  return a instanceof Array;
},

obj = function(o) {
  return o instanceof Object && !fun(o) && !arr(o);
},

str = function(s) {
  return typeof s === 'string';
},

dat = function(d) {
  return !!(d && d.getTimezoneOffset && d.setUTCFullYear) && !isNaN(d);
},

und = function(o) {
  return typeof o === 'undefined';
},

exist = function(o) {
  return !und(o) && o !== null;
},

extend = function() {
  let options, name, src, copy, clone,

  target = arguments[0],
  length = arguments.length,
  i = 1;

  for (; i<length; i++) {
    if ((options = arguments[i]) !== null) {
      for (name in options) {
        src = target[name];
        copy = options[name];

        if (target === copy) {
          continue;
        }

        if (copy && obj(copy)) {
          clone = src && obj(src) ? src : {};
          target[name] = extend(clone, copy);
        } else if (copy !== undefined) {
          target[name] = copy;
        }
      }
    }
  }

  return target;
},

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
  fun: fun,
  arr: arr,
  obj: obj,
  str: str,
  dat: dat,
  und: und,
  exist: exist
};

exports.extend = extend;

exports.titlecase = titlecase;
exports.stringify = stringify;
exports.whitespace = whitespace;