var options = require('./_data/options');
var schema = require('./_data/schema');
var data = require('./_data/data');

describe('Yamb class', function() {
  var Yamb = require('./../lib/yamb/index')(options);

  it('should have default property', function() {
    var post = new Yamb();

    for (var i=0, length = schema.keys.length; i<length; i++) {
      post.should.have.property(schema.keys[i]);
    }

    post.created.should.be.an.instanceOf(Date);

    post.tags.should.be.an.instanceOf(Array);
    post.related.should.be.an.instanceOf(Array);

    post.snippets.should.be.an.instanceOf(Object);
    post.stats.should.be.an.instanceOf(Object);
  });

  it('should not give to overload methods', function() {
    var post = new Yamb();
    var dummy = function() {};

    post.update = dummy;
    post.update.should.not.equal(dummy);

    post.save = dummy;
    post.save.should.not.equal(dummy);

    post.remove = dummy;
    post.remove.should.not.equal(dummy);

    post.toJson = dummy;
    post.toJson.should.not.equal(dummy);
  });

  it('should update property from constructor', function() {
    var post;

    post = new Yamb();
    post.should.have.property('title', '');

    post = new Yamb(null);
    post.should.have.property('title', '');

    post = new Yamb('title');
    post.should.have.property('title', '');

    post = new Yamb(['title', 'text']);
    post.should.have.property('title', '');

    post = new Yamb({title: undefined});
    post.should.have.property('title', '');

    // post = new Yamb({title: null});
    // post.should.have.property('title', '');

    post = new Yamb({title: 'title'});
    post.should.have.property('title', 'title');
  });

  it('should set id from constructor and mark it read-only', function() {
    var post;

    post = new Yamb();
    (function() { post.id; }).should.throw();

    post = new Yamb({id: 10});
    post.should.have.property('id', 10);

    post = new Yamb({_id: 10});
    post.should.have.property('id', 10);

    post = new Yamb({id: 10});
    post.id = 20;
    post.should.have.property('id', 10);
  });

  it('should update property from update method', function() {
    var post = new Yamb();
    post.update(data);

    post.should.have.property('slug', 'a-panhandlers-guide-to-business-life-love');
    post.should.have.property('title', "Pay People What They're Worth");

    post.tags.should.be.an.instanceOf(Array).and.have.length(1);
    post.tags.should.include('business');
  });

  it('should not have property outside schema', function() {
    var post;

    post = new Yamb({
      param1: 'value 1',
      param2: 'value 2',
      param3: ['obj 1', 'obj 2', 'obj 3']
    });

    post.should.not.have.property('param1');
    post.should.not.have.property('param2');
    post.should.not.have.property('param3');

    post = new Yamb();
    post.update(data);

    (function() { post.id; }).should.throw();

    post.should.not.have.property('video');
    post.should.not.have.property('params');
  });

  it('should have title and it must be string', function() {
    var post = new Yamb();

    post.title.should.equal('');

    post.title = undefined;
    post.title.should.equal('');

    post.title = NaN;
    post.title.should.equal('');

    post.title = null;
    post.title.should.equal('');

    post.title = false;
    post.title.should.equal('');

    post.title = [];
    post.title.should.equal('');

    post.title = ['1', '2', '3'];
    post.title.should.equal('');

    post.title = {};
    post.title.should.equal('');

    post.title = 'title';
    post.title.should.equal('title');

    post.title = ' \n\n title   \n\n\n  \n \n  ';
    post.title.should.equal('title');
  });

  // Проверить типы данных в update
  // Проверка всех геттеров/сеттеров по свойствам
  // Проверить toJson метод
  // Проверить save/delete
});