var poor = utils.unexpected({bool: true, arr: true, num: true});
var defaults = schema.data.preview;

it('should works', function() {
  var a = new Yamb();

  a.preview = 'text';
  a.preview.should.equal('text');

  a.preview = ' \n\n text 1\n\ntext 2   \n\n\n  \n \n  ';
  a.preview.should.equal('text 1\n\ntext 2');
});

it('should not update with unexpected values from constructor', function() {
  var a;

  for (var i=0, length=poor.length; i<length; i++) {
    a = new Yamb({preview: poor[i]});
    a.preview.should.equal(defaults);
  }
});

it('should not update with unexpected values from setter', function() {
  var a;

  for (var i=0, length=poor.length; i<length; i++) {
    a = new Yamb();
    a.preview = poor[i];

    a.preview.should.equal(defaults);
  }
});