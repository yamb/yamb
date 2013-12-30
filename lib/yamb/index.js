/* global Symbol */

"use strict";

const schema = require('./schema'),
utils = require('./../utils'),

symbl = Symbol('yamb'),
flags = Symbol('yamb_flags');

function descriptors(opts, props) {
  let methods = require('./proto/methods')(symbl, flags, opts),
  define = require('./proto/define')(symbl),

  properties = {};

  for (let prop in props) {
    properties[prop] = define(prop, props[prop]);
  }

  for (let method in methods) {
    properties[method] = {
      value: methods[method]
    };
  }

  return properties;
}

module.exports = function(opts) {
  let props = require('./proto/props')(symbl, flags, opts),

  yamb = function Yamb(params) {
    this[symbl] = utils.clone(schema);
    this[symbl].created = new Date();

    this[flags] = {title: false, text: false, preview: false};

    if (utils.is.obj(params)) {
      for (let param in params) {
        if (!params.hasOwnProperty(param) || utils.is.und(schema[param])) {
          continue;
        }

        if (utils.is.fun(props[param].validate) && !props[param].validate(params[param])) {
          continue;
        }

        this[symbl][param] = params[param];
      }

      if (params._id || params.id) {
        this[symbl].id = params._id || params.id;
      }
    }
  };

  Object.defineProperties(yamb.prototype, descriptors(opts, props));

  return yamb;
};