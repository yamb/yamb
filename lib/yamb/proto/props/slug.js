"use strict";

const utils = require('./../../../utils');

// yamb.prototype.slug

let validate = function(value) {
  return utils.is.str(value);
};

module.exports = function(symbl) {
  let setter = function(slug) {
    if (!validate(slug)) {
      return;
    }

    slug = utils.stringify(slug).toLowerCase();
    slug = slug.replace(/[\-_]+/g, ' ').replace(/[^a-z0-9 ]/g, '');
    slug = slug.trim().replace(/\s+/g, '-');

    this[symbl].slug = slug;
  };

  return {
    validate: validate,
    set: setter
  };
};