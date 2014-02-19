var poor = utils.unexpected({bool: true, arr: true, num: true});
var defaults = schema.data.author;

function assert(a, name, email, url) {
  a.author.should.be.an.instanceof(Object);
  a.author.should.have.properties(['name', 'email', 'url']);

  a.author.name.should.equal(name);
  a.author.email.should.equal(email);
  a.author.url.should.equal(url);
}

it('should works', function() {
  var a = new Yamb();

  a.author.name = 'Alexey ';
  a.author.email = '  alexey@simonenko.su';
  a.author.url = '  \nhttp://simonenko.su\n  ';

  assert(a, 'Alexey', 'alexey@simonenko.su', 'http://simonenko.su');
});

it('should updated from a string', function() {
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
  };

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

it('should not update with unexpected values from constructor', function() {
  var a;

  for (var i=0, length=poor.length; i<length; i++) {
    a = new Yamb({author: poor[i]});
    assert(a, defaults.name, defaults.email, defaults.url);
  }

  a = new Yamb({author: {
    name: 'Alexey',
    surname: 'Simonenko',
    email: 'alexey@simonenko.su',
    url: 'http://simonenko.su'
  }});

  assert(a, defaults.name, defaults.email, defaults.url);
});

it('should not update with unexpected values from setter', function() {
  var a;

  for (var i=0, length=poor.length; i<length; i++) {
    a = new Yamb();
    a.author = poor[i];

    assert(a, defaults.name, defaults.email, defaults.url);
  }
});

it('should not set property with unexpected values', function() {
  var a;

  for (var i=0, length=poor.length; i<length; i++) {
    a = new Yamb();

    a.author.name = poor[i];
    a.author.email = poor[i];
    a.author.url = poor[i];

    assert(a, defaults.name, defaults.email, defaults.url);
  }
});