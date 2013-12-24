"use strict";

const utils = require('./../../../utils'),

marked = require('marked'),
hljs = require('highlight.js');

marked.setOptions({
  sanitize: false,
  highlight: function(code) {
    return hljs.highlightAuto(code).value;
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