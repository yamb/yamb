/* global Symbol */

"use strict";

const schema = require('./schema'),
utils = require('./../utils');

module.exports = function(opts) {
  let descriptors = {}, yamb, define, props, prop, methods, method;

  opts.sym = Symbol('yamb');
  opts.flags = Symbol('yamb_flags');

  props = require('./proto/props')(opts);
  for (prop in schema) {
    if (schema.hasOwnProperty(prop) && !props.hasOwnProperty(prop)) {
      props[prop] = {};
    }
  }

  yamb = function(params) {
    this[opts.sym] = utils.extend({}, schema);
    this[opts.sym].created = new Date();

    this[opts.flags] = {text: false, preview: false};

    if (utils.is.exist(params) && utils.is.obj(params)) {
      for (let param in params) {
        if (!params.hasOwnProperty(param) || utils.is.und(schema[param])) {
          continue;
        }

        if (utils.is.fun(props[param].validate) && !props[param].validate(params[param])) {
          continue;
        }

        this[opts.sym][param] = params[param];
      }

      if (params.id || params._id) {
        this[opts.sym].id = params._id || params.id;
      }
    }
  };

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