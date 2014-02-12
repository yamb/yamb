/* global Symbol */

"use strict";

var schema = require('./schema');
var utils = require('./../utils');

var priv = {
  symbl: Symbol('yamb'),
  flags: Symbol('yamb_flags')
};

function descriptors(opts, props) {
  var methods = require('./proto/methods')(priv, opts);
  var define = require('./proto/define')(priv);

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
  var props = require('./proto/props')(priv, opts);

  var yamb = function Yamb(params) {
    this[priv.symbl] = utils.clone(schema);
    this[priv.symbl].created = new Date();

    this[priv.flags] = {
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

        this[priv.symbl][param] = params[param];
      }

      if (params._id || params.id) {
        this[priv.symbl].id = params._id || params.id;
      }
    }
  };

  Object.defineProperties(yamb.prototype, descriptors(opts, props));

  return yamb;
};