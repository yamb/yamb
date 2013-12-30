"use strict";

const schema = require('./../schema'),

files = [
  'id', 'uri', 'slug',
  'title', 'preview', 'text',
  'author', 'tags', 'related',
  'stats', 'created', 'active'
],

length = files.length;

module.exports = function(symbl, flags, opts) {
  let props = {}, prop, i;

  for (i=0; i<length; i++) {
    prop = files[i];
    props[prop] = require('./props/' + prop)(symbl, flags, opts);
  }

  for (prop in schema) {
    if (schema.hasOwnProperty(prop) && !props.hasOwnProperty(prop)) {
      props[prop] = {};
    }
  }

  return props;
};