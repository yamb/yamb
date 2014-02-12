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

module.exports = function(priv, opts) {
  var methods = {};

  for (var i=0; i<length; i++) {
    methods[files[i]] = require('./methods/' + files[i])(priv, opts);
  }

  return methods;
};