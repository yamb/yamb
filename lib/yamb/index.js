/* global Symbol */

"use strict";

var schema = require('./schema');
var utils = require('./../utils');

var symbl = Symbol('yamb');
var flags = Symbol('yamb_flags');

function descriptors(opts, props) {
  var methods = require('./proto/methods')(symbl, flags, opts);
  var define = require('./proto/define')(symbl);

  var properties = {};

  for (var prop in props) {
    properties[prop] = define(prop, props[prop]);
  }

  for (var method in methods) {
    properties[method] = {
      value: methods[method]
    };
  }

  return properties;
}

module.exports = function(opts) {
  var props = require('./proto/props')(symbl, flags, opts);

  var yamb = function Yamb(params) {
    this[symbl] = utils.clone(schema);
    this[symbl].created = new Date();

    this[flags] = {
      title: false,
      text: false,
      preview: false
    };

    if (utils.is.obj(params)) {
      for (var param in params) {
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