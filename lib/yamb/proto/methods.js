"use strict";

const files = ['update', 'save', 'remove', 'html', 'json'],
length = files.length;

module.exports = function(symbl, flags, opts) {
  let methods = {}, method, i;

  for (i=0; i<length; i++) {
    method = files[i];
    methods[method] = require('./methods/' + method)(symbl, flags, opts);
  }

  return methods;
};