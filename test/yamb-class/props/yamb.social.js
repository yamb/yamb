var poor = utils.unexpected({bool: true, arr: true, num: true, str: true});
var defaults = schema.data.social;

function assert(a, title, description, image) {
  a.social.should.be.an.instanceof(Object);
  a.social.should.have.properties(['title', 'description', 'image']);

  a.social.title.should.equal(title);
  a.social.description.should.equal(description);
  a.social.image.should.equal(image);
}

it('should works', function() {
  var a = new Yamb();

  a.social.title = '  Social title  ';
  a.social.description = ' \n Description text  ';
  a.social.image = 'cover.png ';

  assert(a, 'Social title', 'Description text', 'cover.png');
});

it('should works', function() {
  var a = new Yamb();

  a.social = {title: 'Social title'};
  assert(a, 'Social title', '', '');
});

it('should updated from an object', function() {
  var a = new Yamb();

  a.social = {
    title: 'Social title ',
    image: '\n \n cover.png',
    description: ' \n Description text  ',
    social: 'buttons'
  };

  assert(a, 'Social title', 'Description text', 'cover.png');

  a.social = {
    title: ''
  };

  assert(a, '', 'Description text', 'cover.png');
});

it('should not be able to delete a property', function() {
  var a = new Yamb();
  a.social = {title: 'Social title'};

  delete a.social.title;
  a.social.title.should.equal('Social title');

  var social = a.social;

  delete social.title;
  a.social.title.should.equal('Social title');
});

it('should not update with unexpected values from constructor', function() {
  var a;

  for (var i=0, length=poor.length; i<length; i++) {
    a = new Yamb({social: poor[i]});
    assert(a, defaults.title, defaults.description, defaults.image);
  }

  a = new Yamb({social: {
    title: 'Title',
    image: 'cover.png',
    description: 'Description text',
    url: 'http://simonenko.su'
  }});

  assert(a, defaults.title, defaults.description, defaults.image);
});

it('should not update with unexpected values from setter', function() {
  var a;

  for (var i=0, length=poor.length; i<length; i++) {
    a = new Yamb();
    a.social = poor[i];

    assert(a, defaults.title, defaults.description, defaults.image);
  }
});

it('should not set property with unexpected values', function() {
  var a;

  for (var i=0, length=poor.length; i<length; i++) {
    if (typeof poor[i] == 'string') {
      continue;
    }

    a = new Yamb();

    a.social.title = poor[i];
    a.social.description = poor[i];
    a.social.image = poor[i];

    assert(a, defaults.title, defaults.description, defaults.image);
  }
});