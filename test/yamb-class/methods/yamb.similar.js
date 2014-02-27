it('should works', function *() {
  var a, b, c, ab, r;

  a = new Yamb(data('twtcst', true));
  a = yield a.update({uri: a.title}).save();

  b = new Yamb(data('twtcst', true));
  b = yield b.update({uri: b.title}).save();

  c = new Yamb(data('twtcst', true));
  c.uri = c.title;
  c.related = [a, b, c];

  c = yield c.save();
  c.related.should.eql([a.id, b.id]);

  ab = yield c.similar();
  ab.should.be.an.instanceof(Array).and.have.length(2);
  ab[0].constructor.name.should.equal('Yamb');
  ab[1].constructor.name.should.equal('Yamb');

  ab = yield c.similar();
  ab.should.be.an.instanceof(Array).and.have.length(2);

  r = yield a.remove();
  r.should.be.true;

  c.related = c.related.concat([100]);

  c = yield c.save();
  c.related.should.eql([b.id]);

  r = yield b.remove();
  r.should.be.true;

  c.reset();

  ab = yield c.similar();
  ab.should.be.an.instanceof(Array).and.have.length(0);

  c = yield c.save();

  ab = yield c.similar();
  ab.should.be.an.instanceof(Array).and.have.length(0);
});