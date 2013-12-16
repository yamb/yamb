"use strict";

const sym = Symbol('yamb'),

schema = require('./schema'),
utils = require('./../utils');

module.exports = function(opts) {
  let descriptors = {}, yamb, define, props, prop, methods, method;

  opts.sym = sym;

  yamb = function(params) {
    this[sym] = utils.extend({}, schema);
    this[sym].created = new Date();

    if (utils.is.exist(params) && utils.is.obj(params)) {
      this[sym] = utils.extend(this[sym], params);

      if (params.id || params._id) {
        this[sym].id = params._id || params.id;
      }
    }

    return this;
  };

  props = require('./proto/props')(opts);
  for (prop in schema) {
    if (schema.hasOwnProperty(prop) && !props.hasOwnProperty(prop)) {
      props[prop] = {};
    }
  }

  define = require('./define')(opts);
  for (prop in props) {
    descriptors[prop] = define(prop, props[prop]);
  }

  methods = require('./proto/methods')(opts);
  for (method in methods) {
    descriptors[method] = {value: methods[method]};
  }

  Object.defineProperties(yamb.prototype, descriptors);

  return yamb;
};