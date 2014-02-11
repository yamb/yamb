var poor = utils.unexpected({bool: true, num: true});

function assert(a, arr) {
  a.tags.should.be.an.instanceof(Array);
  a.tags.should.eql(arr);
}

it('should works', function() {
  var a = new Yamb();
  a.tags = ['tag 1', '  ', 'tag 2'];
  assert(a, ['tag 1', 'tag 2']);
});

it('should work with string', function() {
  var a = new Yamb();
  a.tags = '  tag 1 ';
  assert(a, ['tag 1']);
});

it('should work with comma string', function() {
  var a = new Yamb();
  a.tags = ' tag 1,, tag 2 ,  tag 3';
  assert(a, ['tag 1', 'tag 2', 'tag 3']);
});

it('should be able to clean', function() {
  var a;

  a = new Yamb({tags: ['tag 1']});
  a.tags = '';
  assert(a, []);

  a = new Yamb({tags: ['tag 1']});
  a.tags = [];
  assert(a, []);
});

it('should not update with unexpected values', function() {
  var a, i, length;

  for (i=0, length=poor.length; i<length; i++) {
    a = new Yamb({tags: poor[i]});
    assert(a, schema.data.tags);
  }

  for (i=0, length=poor.length; i<length; i++) {
    a = new Yamb();
    a.tags = poor[i];

    assert(a, schema.data.tags);
  }
});