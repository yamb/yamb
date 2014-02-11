var poor = utils.unexpected({bool: true, arr: true, num: true});

it('should works', function() {
  var a = new Yamb();

  a.text = 'text';
  a.text.should.equal('text');

  a.text = ' \n\n text 1\n\ntext 2   \n\n\n  \n \n  ';
  a.text.should.equal('text 1\n\ntext 2');
});

it('should update preview if they undefined', function() {
  var a;

  a = new Yamb();
  a.text = 'text 1\n\n\n\n text 2';

  a.preview.should.equal('text 1');
  a.text.should.equal('text 1\n\n\n\n text 2');

  a = new Yamb();
  a.preview = 'preview 1';
  a.text = ' \n\n text 1\n\ntext 2   \n\n\n  \n \n  ';

  a.preview.should.equal('preview 1');
  a.text.should.equal('text 1\n\ntext 2');
});

it('should not update with unexpected values', function() {
  var a, i, length;

  for (i=0, length=poor.length; i<length; i++) {
    a = new Yamb({text: poor[i]});
    a.text.should.equal(schema.data.text);
  }

  for (i=0, length=poor.length; i<length; i++) {
    a = new Yamb();
    a.text = poor[i];

    a.text.should.equal(schema.data.text);
  }
});