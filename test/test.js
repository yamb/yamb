describe('Yamb', function() {
  schema = require('./helpers/schema');
  utils = require('./helpers/utils');
  data = require('./_data/data');

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

    describe('#update()', function() {
      require('./yamb.update');
    });

    describe('#reset()', function() {
      require('./yamb.reset');
    });

    describe('#json()', function() {
      require('./yamb.json');
    });

    describe('#html()', function() {
      require('./yamb.html');
    });

    describe('#save()', function() {
      require('./yamb.save');
    });

    describe('#delete()', function() {
      require('./yamb.delete');
    });
  });
});