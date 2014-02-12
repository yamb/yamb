"use strict";

var schema = require('./../schema');

var files = [
  'id',
  'uri',
  'title',
  'preview',
  'text',
  'author',
  'tags',
  'related',
  'stats',
  'created',
  'active'
];

var length = files.length;

module.exports = function(priv, opts) {
  var props = {};

  for (var i=0; i<length; i++) {
    props[files[i]] = require('./props/' + files[i])(priv, opts);
  }

  for (var prop in schema) {
    if (schema.hasOwnProperty(prop) && !props.hasOwnProperty(prop)) {
      props[prop] = {};
    }
  }

  return props;
};