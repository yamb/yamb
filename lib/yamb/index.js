/* global Symbol */

"use strict";

var schema = require('./schema');
var utils = require('./../utils');

var priv = {
  symbl: Symbol('yamb'),
  shado: Symbol('yamb_shadow'),
  flags: Symbol('yamb_flags'),
  cache: Symbol('yamb_cache')
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
    this[priv.shado] = utils.clone(schema);
    this[priv.shado].created = new Date();

    if (utils.is.obj(params)) {
      for (var param in params) {
        if (!params.hasOwnProperty(param) || utils.is.und(schema[param])) {
          continue;
        }

        if (utils.is.fun(props[param].validate) && !props[param].validate(params[param])) {
          continue;
        }

        this[priv.shado][param] = params[param];
      }

      if (params._id || params.id) {
        this[priv.shado].id = params._id || params.id;
      }
    }

    this[priv.symbl] = utils.clone(this[priv.shado]);
    this[priv.flags] = {};
    this[priv.cache] = {};

    for (var flag in schema) {
      if (!schema.hasOwnProperty(flag)) {
        continue;
      }

      this[priv.flags][flag] = false;
    }
  };

  Object.defineProperties(yamb.prototype, descriptors(opts, props));

  return yamb;
};