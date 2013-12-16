var should = require('should');

var options = require('./_data/options');
var schema = require('./_data/schema');
var data = require('./_data/data');

describe('Yamb class', function() {
  var Yamb = require('./../lib/yamb/index')(options);

  it('should have default property', function() {
    var post = new Yamb();

    post.should.have.properties(schema.keys);

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

  it('should have isolated property', function() {
    var a = new Yamb({id: 10, title: 'title for a'});
    var b = new Yamb({id: 20, title: 'title for b'});

    a.title.should.not.equal(b.title);
    a.id.should.not.equal(b.id);
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

  it('should have slug and it must be [a-z0-9] string', function() {
    var post = new Yamb();
    var poor = [undefined, NaN, null, false, true, [], ['1', '2', '3'], {}, {'param': 'value'}];

    should(post.slug).equal(null);

    for (var i=0, length=poor.length; i<length; i++) {
      post.slug = poor[i];
      should(post.slug).equal(null);
    }

    post.slug = 'Пульс твиттера о веб-разработке'
    post.slug.should.equal('');

    post.slug = 'Нужны ли классы в JavaScript?'
    post.slug.should.equal('javascript');

    post.slug = '  Use CSS3  box-sizing-'
    post.slug.should.equal('use-css3-box-sizing');

    post.slug = 'Use CSS3   box-sizing-'
    post.slug.should.equal('use-css3-box-sizing');

    post.slug = '_use_CSS3_box-sizing_   in   2014?'
    post.slug.should.equal('use-css3-box-sizing-in-2014');
  });

  it('should have title and it must be string', function() {
    var post = new Yamb();
    var poor = [undefined, NaN, null, false, true, [], ['1', '2', '3'], {}, {'param': 'value'}];

    post.title.should.equal('');

    for (var i=0, length=poor.length; i<length; i++) {
      post.title = poor[i];
      post.title.should.equal('');
    }

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