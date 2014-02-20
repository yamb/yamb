var poor = utils.unexpected({bool: true});
var defaults = schema.data.related;

poor.push([[1, 2], [3, 4], [5, 6]]);

function assert(a, arr) {
  a.related.should.be.an.instanceof(Array);
  a.related.should.eql(arr);
}

it('should works', function() {
  var a = new Yamb(data('easymongo'));
  var b = new Yamb();
  var c = new Yamb();

  c.related = [b, ' ', a, 200];

  assert(c, ['52fbd292bf40402a959381e3', 200]);
});

it('should work with yamb', function() {
  var a = new Yamb(data('easymongo'));
  var b = new Yamb();

  b.related = a;
  assert(b, ['52fbd292bf40402a959381e3']);
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

  assert(a, defaults);
});

it('should not update with unexpected values from constructor', function() {
  var a;

  for (var i=0, length=poor.length; i<length; i++) {
    a = new Yamb({related: poor[i]});
    assert(a, defaults);
  }
});

it('should not update with unexpected values from setter', function() {
  var a;

  for (var i=0, length=poor.length; i<length; i++) {
    a = new Yamb();
    a.related = poor[i];

    assert(a, defaults);
  }
});