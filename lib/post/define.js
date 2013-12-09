const utils = require('./../utils');

module.exports = function(opts) {

  let define = function(name, prop) {
    let descriptor = {enumerable: true},

    getter = prop.get,
    setter = prop.set;

    if (getter !== false) {
      if (!utils.is.fun(getter) && getter !== false) {
        getter = function() {
          return this[opts.sym][name];
        };
      }

      descriptor.get = getter;
    }

    if (setter !== false) {
      if (!utils.is.fun(setter)) {
        setter = function(value) {
          this[opts.sym][name] = value;
          return this;
        };
      }

      descriptor.set = setter;
    }

    return descriptor;
  };

  return define;
};