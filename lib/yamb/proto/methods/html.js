"use strict";

var utils = require('./../../../utils');

var marked = require('marked');
var hljs = require('highlight.js');

marked.setOptions({
  sanitize: false,
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(lang, code).value;
    } else {
      return code;
    }
  }
});

// yamb.prototype.html()

module.exports = function() {
  return function html(text) {
    if (!utils.is.str(text)) {
      return false;
    }

    return marked(text).trim();
  };
};