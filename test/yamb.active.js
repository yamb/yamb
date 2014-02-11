var poor = utils.unexpected({arr: true, num: true, str: true});

it('should work with boolean', function() {
  var a = new Yamb();

  a.active = true;
  a.active.should.be.true;

  a.active = false;
  a.active.should.be.false;
});

it('should work with Y/N flags', function() {
  var a = new Yamb();

  a.active = 'Y';
  a.active.should.be.true;

  a.active = 'N';
  a.active.should.be.false;
});

it('should not update with unexpected values from constructor', function() {
  var a;

  for (var i=0, length=poor.length; i<length; i++) {
    a = new Yamb({active: poor[i]});
    a.active.should.equal(schema.data.active);
  }
});

it('should not update with unexpected values from setter', function() {
  var a;

  for (var i=0, length=poor.length; i<length; i++) {
    a = new Yamb();
    a.active = poor[i];

    a.active.should.equal(schema.data.active);
  }
});