var poor = utils.unexpected({bool: true, arr: true, num: true});

function assert(a, uri) {
  a.uri.should.equal(utils.yambUri(a.created, uri));
}

it('should works', function() {
  var a = new Yamb();

  a.uri = ' \n  Use CSS3  box-sizing- ';
  assert(a, 'use-css3-box-sizing');

  a.uri = '_use_CSS3_box-sizing_   in   2014?';
  assert(a, 'use-css3-box-sizing-in-2014');
});

it('should works only for [a-z0-9] string', function() {
  var a = new Yamb();

  a.uri = 'Пульс твиттера о веб-разработке';
  a.uri.should.equal(schema.data.uri);

  a.uri = 'Нужны ли классы в JavaScript?';
  assert(a, 'javascript');
});

it('should not update with unexpected values from constructor', function() {
  var a;

  for (var i=0, length=poor.length; i<length; i++) {
    a = new Yamb({uri: poor[i]});
    a.uri.should.equal(schema.data.uri);
  }
});

it('should not update with unexpected values from setter', function() {
  var a;

  for (var i=0, length=poor.length; i<length; i++) {
    a = new Yamb();
    a.uri = poor[i];

    a.uri.should.equal(schema.data.uri);
  }
});