"use strict";

var schema = require('./../schema');
var virtual = require('./virtual');

var files = [
  'id',
  'uri',
  'title',
  'preview',
  'text',
  'tags',
  'related',
  'stats',
  'created',
  'publish',
  'active'
];

var options = {
  author: {
    name: 'author',
    params: ['name', 'email', 'url'],
    direct: 'name'
  },

  meta: {
    name: 'meta',
    params: ['title', 'description', 'keywords']
  },

  social: {
    name: 'social',
    params: ['title', 'description', 'image', 'cover']
  }
};

module.exports = function(priv, opts) {
  var props = {};

  for (var i=0; i<files.length; i++) {
    props[files[i]] = require('./props/' + files[i])(priv, opts);
  }

  for (var name in options) {
    props[name] = virtual(priv, options[name], opts);
  }

  for (var prop in schema) {
    if (schema.hasOwnProperty(prop) && !props.hasOwnProperty(prop)) {
      props[prop] = {};
    }
  }

  return props;
};