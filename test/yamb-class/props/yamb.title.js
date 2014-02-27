var poor = utils.unexpected({bool: true, arr: true, num: true});
var defaults = schema.data.title;

it('should works', function() {
  var a = new Yamb();

  a.title = 'title';
  a.title.should.equal('title');

  a.title = ' \n\n title   \n\n\n  \n \n  ';
  a.title.should.equal('title');
});

it('should not update with unexpected values from constructor', function() {
  var a;

  for (var i=0, length=poor.length; i<length; i++) {
    a = new Yamb({title: poor[i]});
    a.title.should.equal(defaults);
  }
});

it('should not update with unexpected values from setter', function() {
  var a;

  for (var i=0, length=poor.length; i<length; i++) {
    a = new Yamb();
    a.title = poor[i];

    a.title.should.equal(defaults);
  }

  a = new Yamb();
  a.title = ' \n <nobr>  \n  </nobr> ';

  a.title.should.equal(defaults);
});