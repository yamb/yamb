it('should create a new object', function *() {
  var a = new Yamb();

  a.update(data.create);

  a = yield a.save();

  a.should.be.ok;
  a.id.should.equal(10);
  a.uri.should.equal(utils.yambUri(a.created, 'a-panhandlers-guide-to-business-life-love'));
  a.title.should.equal('Pay People What They’re Worth');
});

it('should update an existing object', function *() {
  var a = new Yamb(data.update);

  a.tags = a.tags.concat(['marketing']);
  a.active = false;

  a = yield a.save();

  a.should.be.ok;
  a.id.should.equal(data.update._id);
  a.uri.should.equal(data.update.uri);
  a.title.should.equal(data.update.title);
  a.preview.should.equal(data.update.preview);
  a.text.should.equal(data.update.text);
  a.tags.should.containEql('business');
  a.tags.should.containEql('marketing');
  a.active.should.equal(false);
});

it('should auto create publish property if active', function *() {
  var a = new Yamb(data.update);

  a.publish.should.be.false;
  a.active.should.be.false;

  a.active = true;
  a = yield a.save();

  a.should.be.ok;
  a.publish.should.be.an.instanceof(Date);
  a.publish.toISOString.should.be.type('function');
  a.active.should.be.true;
});

it('should not save if nothing to change', function *() {
  var a = new Yamb(data.update);

  a.publish.should.be.false;
  a.active.should.be.false;

  a = yield a.save();

  a.should.be.ok;
  a.publish.should.be.false;
  a.active.should.be.false;
});

it.skip('should check related');

it('should auto create uri from translation service', function *() {
  var a = new Yamb();

  a.title = 'Заголовок 2014';
  a.text = ' \n\n text 1\n\ntext 2   \n\n\n  \n \n  ';

  a = yield a.save();

  a.should.be.ok;
  a.id.should.equal(10);
  a.uri.should.equal(utils.yambUri(a.created, 'title-2014'));
  a.preview.should.equal('text 1');
  a.text.should.equal('text 1\n\ntext 2');
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

it('should throw error if title empty', function *() {
  var a = new Yamb();
  var e = null;

  a.text = ' \n\n text 1\n\ntext 2   \n\n\n  \n \n  ';

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