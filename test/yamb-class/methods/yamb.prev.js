var params = data('twtcst', true);

function createYamb(title) {
  var a = new Yamb(params);

  a.update({
    title: a.title + ' ' + title,
    publish: new Date('2014-03-01 1' + title + ':00'),
    active: true
  });

  a.reset();

  a.update({uri: a.title});

  return a;
}

it('should works', function *() {
  var r;

  var a = createYamb('1');
  a = yield a.save();

  var b = createYamb('2');
  b = yield b.save();

  var c = createYamb('3');
  c = yield c.save();

  var d = createYamb('4');
  d = yield d.save();

  var e = createYamb('5');
  e = yield e.save();

  r = yield c.prev();
  r.constructor.name.should.equal('Yamb');
  r.id.should.not.false;
  r.title.should.equal('The easiest MongoDB API 2');

  r = yield r.prev();
  r.constructor.name.should.equal('Yamb');
  r.id.should.not.false;
  r.title.should.equal('The easiest MongoDB API 1');

  r = yield r.prev();
  r.should.be.false;

  r = yield c.prev();
  r.constructor.name.should.equal('Yamb');
  r.id.should.not.false;
  r.title.should.equal('The easiest MongoDB API 2');

  r = yield a.remove();
  r.should.be.true;

  r = yield b.remove();
  r.should.be.true;

  r = yield c.remove();
  r.should.be.true;

  r = yield d.remove();
  r.should.be.true;

  r = yield e.remove();
  r.should.be.true;
});

it('should return false if object new', function *() {
  var a = new Yamb();
  var r = yield a.prev();

  r.should.be.false;
});