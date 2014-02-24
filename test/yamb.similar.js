it('should works', function *() {
  var a, b, c, ab, r;

  a = new Yamb();
  a = yield a.update(data('easymongo', true)).save();

  b = new Yamb();
  b = yield b.update(data('easymongo', true)).save();

  c = new Yamb();
  c.update(data('easymongo', true));
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