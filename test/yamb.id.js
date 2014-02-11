it('should works', function() {
  var a = new Yamb({id: 10});
  a.id.should.equal(10);
});

it('should works with _id', function() {
  var a = new Yamb({_id: 10});
  a.id.should.equal(10);
});

it('should be false for new object', function() {
  var a = new Yamb();
  a.id.should.be.false;
});

it('should be readonly', function() {
  var a = new Yamb({id: 10});
  a.id = 20;

  a.id.should.equal(10);
});