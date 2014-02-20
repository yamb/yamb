var should = require('should');

it('should works', function *() {
  var a = new Yamb();
  a.update(data('easymongo', true));

  a = yield a.save();
  a.id.should.not.false;

  var r = yield a.remove();
  r.should.be.true;
});

it('should return error if object not saved yet', function *() {
  var a = new Yamb();
  var e = null;
  var r;

  try {
    r = yield a.remove();
  } catch (err) {
    e = err;
  }

  e.should.not.equal(null);
  e.should.be.an.instanceof(Error);
  should(r).not.be.ok;
});