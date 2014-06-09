var poor = utils.unexpected({bool: true, arr: true, num: true});
var defaults = schema.data.cover;

it('should works', function() {
  var a = new Yamb();

  a.cover = '/img/cover.png';
  a.cover.should.equal('/img/cover.png');

  a.cover = ' \n\n cover.png   \n\n\n  \n \n  ';
  a.cover.should.equal('cover.png');
});

it('should not update with unexpected values from constructor', function() {
  var a;

  for (var i=0, length=poor.length; i<length; i++) {
    a = new Yamb({cover: poor[i]});
    a.cover.should.equal(defaults);
  }
});

it('should not update with unexpected values from setter', function() {
  var a;

  for (var i=0, length=poor.length; i<length; i++) {
    a = new Yamb();
    a.cover = poor[i];

    a.cover.should.equal(defaults);
  }

  a = new Yamb();
  a.cover = ' \n <nobr>  \n  </nobr> ';

  a.cover.should.equal(defaults);
});