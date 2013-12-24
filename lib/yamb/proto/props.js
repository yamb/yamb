"use strict";

const schema = require('./../schema'),

modules = ['id', 'uri', 'slug', 'title', 'preview', 'text', 'author', 'tags', 'related', 'created', 'active'],
length = modules.length;

module.exports = function(symbl, flags, opts) {
  let props = {}, prop, i;

  for (i=0; i<length; i++) {
    prop = modules[i];
    props[prop] = require('./props/' + prop)(symbl, flags, opts);
  }

  for (prop in schema) {
    if (schema.hasOwnProperty(prop) && !props.hasOwnProperty(prop)) {
      props[prop] = {};
    }
  }

  return props;
};