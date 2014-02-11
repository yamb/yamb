var poor = utils.unexpected({bool: true});

function assert(a, arr) {
  a.related.should.be.an.instanceof(Array);
  a.related.should.eql(arr);
}

it('should works', function() {
  var a = new Yamb(data.update);
  var b = new Yamb();
  var c = new Yamb();

  c.related = [b, ' ', a];

  assert(c, [100]);
});

it('should work with number', function() {
  var a = new Yamb();
  a.related = 10;
  assert(a, [10]);
});

it('should work with string', function() {
  var a = new Yamb();
  a.related = '10';
  assert(a, ['10']);
});

it('should be able to clean', function() {
  var a = new Yamb();

  a.related = '10';
  a.related = [];

  assert(a, []);
});

it('should not update with unexpected values', function() {
  var a, i, length;

  for (i=0, length=poor.length; i<length; i++) {
    a = new Yamb({related: poor[i]});
    assert(a, schema.data.related);
  }

  for (i=0, length=poor.length; i<length; i++) {
    a = new Yamb();
    a.related = poor[i];

    assert(a, schema.data.related);
  }
});