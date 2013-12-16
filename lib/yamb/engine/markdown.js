"use strict";

let marked = require('marked'),
hljs = require('highlight.js');

marked.setOptions({
  sanitize: false,
  highlight: function(code, lang) {
    return hljs.highlightAuto(code).value;
  }
});

module.exports = function(text) {
  return marked(text);
};