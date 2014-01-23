var should = require('should');

var options = require('./_data/options');
var schema = require('./_data/schema');
var data = require('./_data/data');

var dummy = function() {};

function pad(num) {
  if (num < 10) {
    return '0' + num;
  } else {
    return num;
  }
}

function yambUri(created, slug) {
  var uri = [
    created.getFullYear(),
    pad(created.getMonth() + 1),
    slug
  ];

  return '/' + uri.join('/');
}

describe('Yamb class', function() {
  var Yamb = require('./../lib/yamb/index')(options);

  it('should have default property', function() {
    var post = new Yamb();

    post.should.have.properties(schema.keys);

    post.snippets.should.be.an.instanceof(Object);
  });

  it('should not give to overload methods', function() {
    var post = new Yamb();

    post.update = dummy;
    post.update.should.not.equal(dummy);

    post.save = dummy;
    post.save.should.not.equal(dummy);

    post.remove = dummy;
    post.remove.should.not.equal(dummy);

    post.json = dummy;
    post.json.should.not.equal(dummy);
  });

  it('should update property from constructor', function() {
    var a = new Yamb();
    a.should.have.property('title', '');

    var b = new Yamb(null);
    b.should.have.property('title', '');

    var c = new Yamb('title');
    c.should.have.property('title', '');

    var d = new Yamb(['title', 'text']);
    d.should.have.property('title', '');
  });

  it('should not update properties with bad params', function() {
    var post, json;
    var poor = [undefined, NaN, null, false, true, [], ['1', '2', '3'], {}, {'param': 'value'}, dummy];

    for (var i=0, length=poor.length; i<length; i++) {
      post = new Yamb();
      json = post.json();

      post.update(poor[i]);
      post.json().should.eql(json);
    }
  });

  it('should set id from constructor and mark it read-only', function() {
    var post;

    post = new Yamb();
    post.id.should.be.false;

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

    a.title.should.not.eql(b.title);
    a.id.should.not.eql(b.id);
  });

  it('should update property from update method', function() {
    var post = new Yamb();
    post.update(data.create);

    post.should.have.property('uri', yambUri(post.created, 'a-panhandlers-guide-to-business-life-love'));
    post.should.have.property('title', "Pay People What They're Worth");

    post.tags.should.be.an.instanceof(Array).and.have.length(1);
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

    var json = post.json();
    json.should.not.have.property('param1');
    json.should.not.have.property('param2');
    json.should.not.have.property('param3');

    post = new Yamb();
    post.update(data.create);
    post.id.should.be.false;

    post.should.not.have.property('video');
    post.should.not.have.property('params');
  });

  it('should have uri and it must be [a-z0-9] string', function() {
    var post, i, length;
    var poor = [undefined, NaN, null, false, true, ' ', [], ['1', '2', '3'], {}, {'param': 'value'}, dummy];

    for (i=0, length=poor.length; i<length; i++) {
      post = new Yamb({uri: poor[i]});
      should(post.uri).equal(schema.data.uri);
    }

    post = new Yamb();
    should(post.uri).equal(schema.data.uri);

    for (i=0, length=poor.length; i<length; i++) {
      post.uri = poor[i];
      should(post.uri).equal(schema.data.uri);
    }

    post.uri = 'Пульс твиттера о веб-разработке';
    post.uri.should.be.false;

    post.uri = 'Нужны ли классы в JavaScript?';
    post.uri.should.equal(yambUri(post.created, 'javascript'));

    post.uri = '  Use CSS3  box-sizing-';
    post.uri.should.equal(yambUri(post.created, 'use-css3-box-sizing'));

    post.uri = 'Use CSS3   box-sizing-';
    post.uri.should.equal(yambUri(post.created, 'use-css3-box-sizing'));

    post.uri = '_use_CSS3_box-sizing_   in   2014?';
    post.uri.should.equal(yambUri(post.created, 'use-css3-box-sizing-in-2014'));
  });

  it('should have title and it must be a string', function() {
    var post, i, length;
    var poor = [undefined, NaN, null, false, true, ' ', [], ['1', '2', '3'], {}, {'param': 'value'}, dummy];

    for (i=0, length=poor.length; i<length; i++) {
      post = new Yamb({title: poor[i]});
      post.title.should.equal(schema.data.title);
    }

    post = new Yamb();
    post.title.should.equal(schema.data.title);

    for (i=0, length=poor.length; i<length; i++) {
      post.title = poor[i];
      post.title.should.equal(schema.data.title);
    }

    post.title = 'title';
    post.title.should.equal('title');

    post.title = ' \n\n title   \n\n\n  \n \n  ';
    post.title.should.equal('title');
  });

  it('should have preview and it must be a string', function() {
    var post, i, length;
    var poor = [undefined, NaN, null, false, true, ' ', [], ['1', '2', '3'], {}, {'param': 'value'}, dummy];

    for (i=0, length=poor.length; i<length; i++) {
      post = new Yamb({preview: poor[i]});
      post.preview.should.equal(schema.data.preview);
    }

    post = new Yamb();
    post.preview.should.equal(schema.data.preview);

    for (i=0, length=poor.length; i<length; i++) {
      post.preview = poor[i];
      post.preview.should.equal(schema.data.preview);
    }

    post.preview = 'text';
    post.preview.should.equal('text');

    post.preview = ' \n\n text 1\n\ntext 2   \n\n\n  \n \n  ';
    post.preview.should.equal('text 1\n\ntext 2');
  });

  it('should have text and it must be a string', function() {
    var post, i, length;
    var poor = [undefined, NaN, null, false, true, ' ', [], ['1', '2', '3'], {}, {'param': 'value'}, dummy];

    for (i=0, length=poor.length; i<length; i++) {
      post = new Yamb({text: poor[i]});
      post.text.should.equal(schema.data.text);
    }

    post = new Yamb();
    post.text.should.equal(schema.data.text);

    for (i=0, length=poor.length; i<length; i++) {
      post.text = poor[i];
      post.text.should.equal(schema.data.text);
    }

    post = new Yamb();
    post.text = 'text';
    post.preview.should.equal('text');
    post.text.should.equal('text');

    post = new Yamb();
    post.text = 'text\n\n';
    post.preview.should.equal('text');
    post.text.should.equal('text');

    post = new Yamb();
    post.text = 'text 1\n\n\n\n text 2';
    post.preview.should.equal('text 1');
    post.text.should.equal('text 1\n\n\n\n text 2');

    post = new Yamb();
    post.text = ' \n\n text 1\n\ntext 2   \n\n\n  \n \n  ';
    post.preview.should.equal('text 1');
    post.text.should.equal('text 1\n\ntext 2');

    post = new Yamb();
    post.preview = 'preview 1';
    post.text = ' \n\n text 1\n\ntext 2   \n\n\n  \n \n  ';
    post.text.should.equal('text 1\n\ntext 2');
  });

  it('should have author and it must be an specific object', function() {
    var post, i, length;
    var poor = [undefined, NaN, null, false, true, [], ['1', '2', '3'], {}, {'param': 'value'}, dummy];

    function shouldAuthor(author, name, email) {
      author.should.be.an.instanceof(Object);
      author.should.have.property('name', name);
      author.should.have.property('email', email);
    }

    for (i=0, length=poor.length; i<length; i++) {
      post = new Yamb({author: poor[i]});
      shouldAuthor(post.author, '', '');
    }

    post = new Yamb();
    shouldAuthor(post.author, '', '');

    for (i=0, length=poor.length; i<length; i++) {
      post.author = poor[i];
      shouldAuthor(post.author, '', '');
    }

    post = new Yamb();
    post.author = 'Alexey Simonenko';
    shouldAuthor(post.author, 'Alexey Simonenko', '');

    post.author = {email: 'alexey@simonenko.su'};
    shouldAuthor(post.author, 'Alexey Simonenko', 'alexey@simonenko.su');

    post.author = {name: 'Alexey', email: 'dwarfman@gmail.com'};
    shouldAuthor(post.author, 'Alexey', 'dwarfman@gmail.com');

    var author = post.author;
    author.name = 'Alexey Simonenko';
    post.author.name.should.equal('Alexey');

    post = new Yamb();
    post.author.name = 'Alexey Simonenko';
    post.author.name.should.equal('');
  });

  it('should have related list and it must be an array', function() {
    var post, i, length;
    var poor = [undefined, NaN, null, false, true, [], [{'param': 'value'}], {}, {'param': 'value'}, dummy];

    for (i=0, length=poor.length; i<length; i++) {
      post = new Yamb({related: poor[i]});
      post.related.should.eql([]);
    }

    post = new Yamb();
    post.related.should.eql([]);
    post.related.should.be.an.instanceof(Array);

    for (i=0, length=poor.length; i<length; i++) {
      post.related = poor[i];
      post.related.should.eql([]);
    }

    var a = new Yamb();
    var b = new Yamb(data.update);
    var c = new Yamb();
    c.update(data.create);

    post = new Yamb();
    post.related = 10;
    post.related.should.eql([10]);

    post = new Yamb();
    post.related = '10';
    post.related.should.eql(['10']);

    post.related = [];
    post.related.should.eql([]);

    post = new Yamb();
    post.related = a;
    post.related.should.eql([]);

    post = new Yamb();
    post.related = b;
    post.related.should.eql([100]);

    post = new Yamb();
    post.related = [a, b, c];
    post.related.should.eql([100]);

    post = new Yamb();
    post.related = [10, null, '10', a, {}, b, dummy, c];
    post.related.should.eql([10, '10', 100]);
  });

  it('should have tags list and it must be an array', function() {
    var post, i, length;
    var poor = [undefined, NaN, null, 0, 10, true, false, [], {}, {'param': 'value'}, dummy];

    for (i=0, length=poor.length; i<length; i++) {
      post = new Yamb({tags: poor[i]});
      post.tags.should.eql([]);
    }

    post = new Yamb();
    post.tags.should.eql([]);
    post.tags.should.be.an.instanceof(Array);

    for (i=0, length=poor.length; i<length; i++) {
      post.tags = poor[i];
      post.tags.should.eql([]);
    }

    post.tags = '';
    post.tags.should.eql([]);

    post.tags = [''];
    post.tags.should.eql([]);

    post.tags = '  tag 1 ';
    post.tags.should.eql(['tag 1']);

    post.tags = ' tag 1,, tag 2 ,  tag 3';
    post.tags.should.eql(['tag 1', 'tag 2', 'tag 3']);

    post.tags = ['tag 1', 'tag 2'];
    post.tags.should.eql(['tag 1', 'tag 2']);

    post.tags = 'tag 1';
    post.tags.should.eql(['tag 1']);

    post.tags.push('tag 2');
    post.tags.should.eql(['tag 1', 'tag 2']);

    post.tags = '';
    post.tags.should.eql([]);
  });

  it('should have statistics params', function() {
    var post, i, length;
    var poor = [undefined, NaN, null, true, false, [], [10, 20], {}, {'param': 'value'}, dummy];

    function shouldStatistics(stats, views, likes, comments) {
      stats.should.be.an.instanceof(Object);
      stats.should.have.properties(['views', 'likes', 'comments']);

      stats.views.should.eql(views);
      stats.likes.should.eql(likes);
      stats.comments.should.eql(comments);
    }

    for (i=0, length=poor.length; i<length; i++) {
      post = new Yamb({stats: poor[i]});
      shouldStatistics(post.stats, 0, 0, 0);
    }

    for (i=0, length=poor.length; i<length; i++) {
      post = new Yamb();
      post.stats = poor[i];
      shouldStatistics(post.stats, 0, 0, 0);
    }

    post = new Yamb({stats: {unqiue: 10, facebook: 5, twitter: 20}});
    shouldStatistics(post.stats, 0, 0, 0);

    post = new Yamb({stats: {views: '10', comments: '5', likes: '20'}});
    shouldStatistics(post.stats, 0, 0, 0);

    post = new Yamb({stats: {views: 10, comments: 5, likes: 20}});
    shouldStatistics(post.stats, 10, 20, 5);

    var a = new Yamb();
    shouldStatistics(a.stats, 0, 0, 0);

    for (i=0, length=poor.length; i<length; i++) {
      a.stats.views = poor[i];
      a.stats.views.should.eql(0);

      a.stats = {views: poor[i]};
      a.stats.views.should.eql(0);
    }

    a.stats = {views: 10, comments: '5', likes: 'test-20', unique: 30};
    shouldStatistics(a.stats, 10, 0, 5);

    a.stats.views++;
    a.stats.views++;
    a.stats.views.should.eql(12);

    var b = new Yamb();
    shouldStatistics(b.stats, 0, 0, 0);

    b.update({stats: {views: 10, likes: 5, comments: 'test'}});
    shouldStatistics(b.stats, 10, 5, 0);

    b.stats = {unqiue: 10, facebook: 5, twitter: 20};
    shouldStatistics(b.stats, 10, 5, 0);
  });

  it('should have create time and it must be a date', function() {
    var post, current;

    var poor = [undefined, NaN, null, 0, 10, '', 'string', [], ['1', '2', '3'], {}, {'param': 'value'}, dummy];

    var string = '2013-12-17 1:52';
    var object = new Date(string);

    for (var i=0, length=poor.length; i<length; i++) {
      post = new Yamb({created: poor[i]});
      post.created.should.be.an.instanceof(Date);
    }

    post = new Yamb();
    current = post.created;

    post.created.should.be.an.instanceof(Date);
    post.created.toISOString.should.be.type('function');

    post.created = string;
    post.created.toISOString().should.equal(current.toISOString());

    (function() { post.update({created: string}); }).should.throw();

    post = new Yamb({created: string});
    post.created.toISOString().should.equal(object.toISOString());

    post = new Yamb({created: object});
    post.created.toISOString().should.equal(object.toISOString());
  });

  it('should have active property and it must be a boolean', function() {
    var post, i, length;
    var poor = [undefined, NaN, null, 0, 10, '', 'string', [], ['1', '2', '3'], {}, {'param': 'value'}, dummy];

    for (i=0, length=poor.length; i<length; i++) {
      post = new Yamb({active: poor[i]});
      post.active.should.equal(schema.data.active);
    }

    post = new Yamb({active: 'Y'});
    post.active.should.equal(schema.data.active);

    post = new Yamb();
    post.active.should.equal(schema.data.active);

    for (i=0, length=poor.length; i<length; i++) {
      post.active = poor[i];
      post.active.should.equal(schema.data.active);
    }

    post.active = true;
    post.active.should.be.true;

    post.active = false;
    post.active.should.be.false;

    post.active = 'Y';
    post.active.should.be.true;

    post.active = 'N';
    post.active.should.be.false;
  });

  it('should export data to json', function() {
    var post = new Yamb(data.create);
    var json = post.json();

    json.title = 'Title';
    json.should.not.equal(post.json());
    json.title.should.not.equal(post.title);
    json.created.should.be.an.instanceof(Date);
    json.created.toISOString.should.be.type('function');
  });

  // uri: ''
  // snippets: {}
});