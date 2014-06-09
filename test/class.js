describe('Yamb class', function() {
  schema = require('./helpers/schema');
  utils = require('./helpers/utils');
  data = require('./data');

  yamb = require('./helpers/yamb')(true, true);
  Yamb = require('./helpers/yamb')(false, true);

  describe('#constructor()', function() {
    require('./yamb-class/yamb.constructor');
  });

  describe('properties', function() {
    var props = [
      'id',
      'uri',
      'title',
      'preview',
      'text',
      'cover',
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
        require('./yamb-class/props/yamb.' + props[i]);
      });
    }
  });

  describe('methods', function() {
    require('./yamb-class/yamb.methods');

    var methods = [
      'update',
      'reset',
      'json',
      'html',
      'save',
      'delete',
      'next',
      'prev',
      'similar'
    ];

    for (var i=0, length=methods.length; i<length; i++) {
      describe('#' + methods[i] + '()', function() {
        require('./yamb-class/methods/yamb.' + methods[i]);
      });
    }
  });
});