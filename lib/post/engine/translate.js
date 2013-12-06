let yandex = require('yandex-translate');

module.exports = function(text, key) {
  return function(fn) {
    yandex(text, {to: 'en', key: key}, fn);
  };
};