"use strict";

var files = [
  'update',
  'save',
  'remove',
  'similar',
  'html',
  'json'
];

var length = files.length;

module.exports = function(symbl, flags, opts) {
  var methods = {};

  for (var i=0; i<length; i++) {
    methods[files[i]] = require('./methods/' + files[i])(symbl, flags, opts);
  }

  return methods;
};