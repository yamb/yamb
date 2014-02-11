var poor = utils.unexpected({bool: true, arr: true, num: true});

it('should works', function() {
  var a = new Yamb();

  a.uri = ' \n  Use CSS3  box-sizing- ';
  a.uri.should.equal(utils.yambUri(a.created, 'use-css3-box-sizing'));

  a.uri = '_use_CSS3_box-sizing_   in   2014?';
  a.uri.should.equal(utils.yambUri(a.created, 'use-css3-box-sizing-in-2014'));
});

it('should works only for [a-z0-9] string', function() {
  var a = new Yamb();

  a.uri = 'Пульс твиттера о веб-разработке';
  a.uri.should.equal(schema.data.uri);

  a.uri = 'Нужны ли классы в JavaScript?';
  a.uri.should.equal(utils.yambUri(a.created, 'javascript'));
});

it('should not update with unexpected values', function() {
  var a, i, length;

  for (i=0, length=poor.length; i<length; i++) {
    a = new Yamb({uri: poor[i]});
    a.uri.should.equal(schema.data.uri);
  }

  for (i=0, length=poor.length; i<length; i++) {
    a = new Yamb();
    a.uri = poor[i];

    a.uri.should.equal(schema.data.uri);
  }
});