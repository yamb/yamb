var params = data('twtcst', true);

function createYamb(title, active) {
  params.created = new Date('2014-03-01 1' + title + ':00');

  var a = new Yamb(params);
  var props = {title: a.title + ' ' + title};

  if (active) {
    props.publish = new Date('2014-03-01 1' + title + ':00');
    props.active = active;
  }

  a.update(props).reset().update({uri: a.title});

  return a;
}

beforeEach(function *() {
  var r = yield yamb.remove();
});

it('should work for published obects', function *() {
  var r;

  var a = createYamb('1', true);
  a = yield a.save();

  var b = createYamb('2', false);
  b = yield b.save();

  var c = createYamb('3', true);
  c = yield c.save();

  var d = createYamb('4', false);
  d = yield d.save();

  var e = createYamb('5', true);
  e = yield e.save();

  r = yield a.next();
  r.constructor.name.should.equal('Yamb');
  r.id.should.not.false;
  r.title.should.equal('The easiest MongoDB API 3');

  r = yield r.next();
  r.constructor.name.should.equal('Yamb');
  r.id.should.not.false;
  r.title.should.equal('The easiest MongoDB API 5');

  r = yield r.next();
  r.should.be.false;

  r = yield a.next();
  r.constructor.name.should.equal('Yamb');
  r.id.should.not.false;
  r.title.should.equal('The easiest MongoDB API 3');
});

it('should work for all obects', function *() {
  var r;

  var a = createYamb('1', false);
  a = yield a.save();

  var b = createYamb('2', true);
  b = yield b.save();

  var c = createYamb('3', false);
  c = yield c.save();

  var d = createYamb('4', true);
  d = yield d.save();

  var e = createYamb('5', false);
  e = yield e.save();

  r = yield c.next(true);
  r.constructor.name.should.equal('Yamb');
  r.id.should.not.false;
  r.title.should.equal('The easiest MongoDB API 4');

  r = yield r.next(true);
  r.constructor.name.should.equal('Yamb');
  r.id.should.not.false;
  r.title.should.equal('The easiest MongoDB API 5');

  r = yield r.next(true);
  r.should.be.false;

  r = yield c.next(true);
  r.constructor.name.should.equal('Yamb');
  r.id.should.not.false;
  r.title.should.equal('The easiest MongoDB API 4');
});

it('should return false if object new', function *() {
  var a = new Yamb();
  var r = yield a.next();

  r.should.be.false;
});