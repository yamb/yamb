describe('Yamb', function() {
  should = require('should');

  schema = require('./helpers/schema');
  utils = require('./helpers/utils');
  data = require('./_data/data');

  Yamb = require('./helpers/yamb');

  var props = ['id', 'uri', 'title', 'preview', 'text', 'author', 'related', 'tags', 'stats', 'created', 'active'];

  for (var i=0, length=props.length; i<length; i++) {
    describe(props[i] + ' property', function() {
      require('./yamb.' + props[i]);
    });
  }

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