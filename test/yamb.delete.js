var should = require('should');
var co = require('co');

it('should works', function(done) {
  co(function *() {
    var a = new Yamb(data.create);
    var r = yield a.remove();

    r.should.be.true;

    done();
  })();
});

it('should remove newly created object', function(done) {
  co(function *() {
    var a = new Yamb();
    a.update(data.create);

    a = yield a.save();
    a.should.be.ok;

    var r = yield a.remove();
    r.should.be.true;

    done();
  })();
});

it('should return error if object not saved yet', function(done) {
  co(function *() {
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

    done();
  })();
});