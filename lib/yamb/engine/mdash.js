"use strict";

let mdash = require('mdash');

module.exports = function(text) {
  return function(fn) {
    mdash.apply(text, fn);
  };
};