describe('Yamb', function() {
  schema = require('./helpers/schema');
  utils = require('./helpers/utils');
  data = require('./data');

  Yamb = require('./helpers/yamb')(true);

  describe('#constructor()', function() {
    require('./yamb.constructor');
  });

  describe('properties', function() {
    var props = [
      'id',
      'uri',
      'title',
      'preview',
      'text',
      'author',
      'tags',
      'related',
      'meta',
      'social',
      'stats',
      'created',
      'publish',
      'active'
    ];

    for (var i=0, length=props.length; i<length; i++) {
      describe(props[i], function() {
        require('./yamb.' + props[i]);
      });
    }
  });

  describe('methods', function() {
    require('./yamb.methods');

    var methods = [
      'update',
      'reset',
      'json',
      'html',
      'save',
      'delete',
      'similar'
    ];

    for (var i=0, length=methods.length; i<length; i++) {
      describe('#' + methods[i] + '()', function() {
        require('./yamb.' + methods[i]);
      });
    }
  });
});