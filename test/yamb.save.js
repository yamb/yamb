it('should create a new object', function *() {
  var a = new Yamb();
  a.update(data('easymongo', true));

  a = yield a.save();

  a.id.should.not.false;
  a.uri.should.equal(utils.yambUri(a.created, 'the-easiest-mongodb-api'));
  a.title.should.equal('The easiest MongoDB API');
});

it('should update an existing object', function *() {
  var params = data('easymongo');
  var a = new Yamb(params);

  a.tags = a.tags.concat(['javascript']);
  a.active = false;

  a = yield a.save();

  a.id.should.equal(params.id);

  a.title.should.equal(params.title);
  a.preview.should.equal(params.preview);
  a.text.should.equal(params.text);

  a.tags.should.containEql('coffeescript');
  a.tags.should.containEql('javascript');

  a.active.should.equal(false);
});

it('should auto create publish property if active', function *() {
  var a = new Yamb();

  a.update(data('tumblr', true));
  a = yield a.save();

  a.publish.should.be.false;
  a.active.should.be.false;

  a.active = true;
  a = yield a.save();

  a.publish.should.be.an.instanceof(Date);
  a.publish.toISOString.should.be.type('function');
  a.active.should.be.true;
});

it('should not save if nothing to change', function *() {
  var a = new Yamb(data('tumblr'));
  a.active = true;

  a = yield a.save();
  a.active.should.be.true;
});

it('should auto create uri from translation service', function *() {
  var a = new Yamb();
  a.update(data('tumblr', true));

  a.title = 'Заголовок 2014';
  a.uri.should.be.false;

  a = yield a.save();

  a.id.should.not.false;
  a.title.should.equal('Заголовок 2014');
  a.uri.should.equal(utils.yambUri(a.created, 'title-2014'));
});

it('should throw error if title empty', function *() {
  var a = new Yamb();
  var e = null;

  a.text = 'text';

  try {
    a = yield a.save();
  } catch (err) {
    a = false;
    e = err;
  }

  e.should.not.equal(null);
  e.should.be.an.instanceof(Error);
  a.should.not.be.ok;
});

it('should throw error if text empty', function *() {
  var a = new Yamb();
  var e = null;

  a.title = 'title';

  try {
    a = yield a.save();
  } catch (err) {
    a = false;
    e = err;
  }

  e.should.not.equal(null);
  e.should.be.an.instanceof(Error);
  a.should.not.be.ok;
});