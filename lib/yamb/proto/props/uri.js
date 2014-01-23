"use strict";

const utils = require('./../../../utils');

function pad(num) {
  if (num < 10) {
    return '0' + num;
  } else {
    return num;
  }
}

// yamb.prototype.uri

let validate = function(value) {
  return utils.is.str(value) && !utils.whitespace(value);
};

module.exports = function(symbl) {
  let setter = function(slug) {
    if (!validate(slug)) {
      return;
    }

    slug = utils.stringify(slug).toLowerCase();
    slug = slug.replace(/[\-_]+/g, ' ').replace(/[^a-z0-9 ]/g, '');
    slug = slug.trim().replace(/\s+/g, '-');

    if (utils.whitespace(slug)) {
      return;
    }

    let uri = [
      this.created.getFullYear(),
      pad(this.created.getMonth() + 1),
      slug
    ];

    this[symbl].uri = '/' + uri.join('/');
  };

  return {
    validate: validate,
    set: setter
  };
};