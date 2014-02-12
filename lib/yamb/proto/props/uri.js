"use strict";

var utils = require('./../../../utils');

// yamb.prototype.uri

var validate = function(value) {
  return utils.is.str(value) && !utils.whitespace(value);
};

module.exports = function(priv) {
  var setter = function(slug) {
    if (!validate(slug)) {
      return;
    }

    slug = utils.stringify(slug).toLowerCase();
    slug = slug.replace(/[\-_]+/g, ' ').replace(/[^a-z0-9 ]/g, '');
    slug = slug.trim().replace(/\s+/g, '-');

    if (utils.whitespace(slug)) {
      return;
    }

    var uri = [
      this.created.getFullYear(),
      utils.pad(this.created.getMonth() + 1),
      slug
    ];

    this[priv.symbl].uri = '/' + uri.join('/');
  };

  return {
    validate: validate,
    set: setter
  };
};