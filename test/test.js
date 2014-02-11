describe('Yamb', function() {
  should = require('should');

  schema = require('./helpers/schema');
  utils = require('./helpers/utils');
  data = require('./_data/data');

  Yamb = require('./helpers/yamb');

  describe('methods', function() {
    require('./yamb.methods');
  });

  describe('#constructor()', function() {
    require('./yamb.constructor');
  });

  describe('#update()', function() {
    require('./yamb.update');
  });

  describe('#json()', function() {
    require('./yamb.json');
  });
});