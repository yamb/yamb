"use strict";

const utils = require('./../../../utils');

// yamb.prototype.author

let validate = function(value) {
  if (utils.is.str(value)) {
    return true;
  }

  return utils.is.obj(value) && (utils.is.str(value.name) || utils.is.str(value.email));
};

module.exports = function(symbl) {
  let getter = function() {
    return utils.clone(this[symbl].author);
  };

  let setter = function(author) {
    if (!validate(author)) {
      return this;
    }

    let data = this[symbl].author;

    if (utils.is.str(author)) {
      data.name = author;
    } else {
      if (author.name && !utils.whitespace(author.name)) {
        data.name = author.name;
      }

      if (author.email && !utils.whitespace(author.email)) {
        data.email = author.email;
      }
    }

    this[symbl].author = data;

    return this;
  };

  return {
    validate: validate,
    get: getter,
    set: setter
  };
};