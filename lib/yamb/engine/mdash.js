"use strict";

let mdash = require('mdash');

mdash.endpoint = 'http://simone.nko.io/mdash';
module.exports = function(text) {
  return function(fn) {
    mdash.apply(text, fn);
  };
};