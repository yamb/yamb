"use strict";

const utils = require('./../../../utils'),

marked = require('marked'),
hljs = require('highlight.js');

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

    return marked(text);
  };
};