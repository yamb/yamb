var poor = utils.unexpected({bool: true, arr: true, num: true});

it('should works', function() {
  var a = new Yamb();

  a.title = 'title';
  a.title.should.equal('title');

  a.title = ' \n\n title   \n\n\n  \n \n  ';
  a.title.should.equal('title');
});

it('should not update with unexpected values', function() {
  var a, i, length;

  for (i=0, length=poor.length; i<length; i++) {
    a = new Yamb({title: poor[i]});
    a.title.should.equal(schema.data.title);
  }

  for (i=0, length=poor.length; i<length; i++) {
    a = new Yamb();
    a.title = poor[i];

    a.title.should.equal(schema.data.title);
  }
});