var poor = utils.unexpected({bool: true, num: true});
var defaults = schema.data.tags;

function assert(a, arr) {
  a.tags.should.be.an.instanceof(Array);
  a.tags.should.eql(arr);
}

it('should works', function() {
  var a = new Yamb();
  a.tags = ['tag 1', '  ', 'tag 2', ' <nobr> \n </nobr>'];
  assert(a, ['tag 1', 'tag 2']);
});

it('should work with string', function() {
  var a = new Yamb();
  a.tags = '  tag 1 ';
  assert(a, ['tag 1']);
});

it('should work with comma string', function() {
  var a = new Yamb();
  a.tags = ' tag 1,, tag 2 , <b> </b> , tag 3';
  assert(a, ['tag 1', 'tag 2', 'tag 3']);
});

it('should be able to clean', function() {
  var a;

  a = new Yamb({tags: ['tag 1']});
  a.tags = '';
  assert(a, defaults);

  a = new Yamb({tags: ['tag 1']});
  a.tags = [];
  assert(a, defaults);
});

it('should not update with unexpected values from constructor', function() {
  var a;

  for (var i=0, length=poor.length; i<length; i++) {
    a = new Yamb({tags: poor[i]});
    assert(a, defaults);
  }
});

it('should not update with unexpected values from setter', function() {
  var a;

  for (var i=0, length=poor.length; i<length; i++) {
    a = new Yamb();
    a.tags = poor[i];

    assert(a, defaults);
  }
});