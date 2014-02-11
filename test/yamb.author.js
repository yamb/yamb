var poor = utils.unexpected({bool: true, arr: true, num: true});

function assert(a, name, email, url) {
  a.author.should.be.an.instanceof(Object);
  a.author.should.have.properties(['name', 'email', 'url']);

  a.author.name.should.equal(name);
  a.author.email.should.equal(email);
  a.author.url.should.equal(url);
}

it('should works', function() {
  var a = new Yamb();

  a.author = 'Alexey';
  assert(a, 'Alexey', '', '');
});

it('should updated from an object', function() {
  var a = new Yamb();

  a.author = {
    name: 'Alexey ',
    gender: 'male',
    email: ' \n alexey@simonenko.su  ',
    surname: 'Simonenko'
  };

  assert(a, 'Alexey', 'alexey@simonenko.su', '');

  a.author = {
    name: '',
    url: '\n \n http://simonenko.su'
  }

  assert(a, '', 'alexey@simonenko.su', 'http://simonenko.su');
});

it('should not be able to delete a property', function() {
  var a = new Yamb();
  a.author = 'Alexey';

  delete a.author.name;
  a.author.name.should.equal('Alexey');

  var author = a.author;

  delete author.name;
  a.author.name.should.equal('Alexey');
});

it('should not update with unexpected values', function() {
  var a, i, length;

  for (i=0, length=poor.length; i<length; i++) {
    a = new Yamb({author: poor[i]});
    assert(a, schema.data.author.name, schema.data.author.email, schema.data.author.url);
  }

  for (i=0, length=poor.length; i<length; i++) {
    a = new Yamb();
    a.author = poor[i];

    assert(a, schema.data.author.name, schema.data.author.email, schema.data.author.url);
  }

  a = new Yamb({author: {
    name: 'Alexey',
    surname: 'Simonenko',
    email: 'alexey@simonenko.su',
    url: 'http://simonenko.su'
  }});

  assert(a, schema.data.author.name, schema.data.author.email, schema.data.author.url);
});