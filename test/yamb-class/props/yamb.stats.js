var poor = utils.unexpected({bool: true, arr: true, num: true, str: true});
var defaults = schema.data.stats;

function assert(a, views, likes, comments) {
  a.stats.should.be.an.instanceof(Object);
  a.stats.should.have.properties(['views', 'likes', 'comments']);

  a.stats.views.should.equal(views);
  a.stats.likes.should.equal(likes);
  a.stats.comments.should.equal(comments);
}

it('should works', function() {
  var a = new Yamb({stats: {
    views: 10,
    comments: 5,
    likes: 20
  }});

  assert(a, 10, 20, 5);
});

it('should always work with numbers', function() {
  var a = new Yamb();

  a.stats.views++;
  a.stats.views++;

  a.stats = {likes: '10'};

  a.stats.comments = '100';
  a.stats.comments++;

  assert(a, 2, 10, 101);
});

it('should not be able to delete a property', function() {
  var a = new Yamb();
  a.stats = {views: 10, comments: '5', likes: '100'};

  delete a.stats.comments;
  a.stats.comments.should.equal(5);

  var stats = a.stats;

  delete stats.likes;
  a.stats.likes.should.equal(100);
});

it('should not update with unexpected values from constructor', function() {
  var a;

  for (var i=0, length=poor.length; i<length; i++) {
    a = new Yamb({stats: poor[i]});
    assert(a, defaults.views, defaults.likes, defaults.comments);
  }

  a = new Yamb({stats: {
    views: '10',
    comments: '5',
    likes: '20'
  }});

  assert(a, defaults.views, defaults.likes, defaults.comments);
});

it('should not update with unexpected values from setter', function() {
  var a;

  for (var i=0, length=poor.length; i<length; i++) {
    a = new Yamb();
    a.stats = poor[i];

    assert(a, defaults.views, defaults.likes, defaults.comments);
  }
});

it('should not set property with unexpected values', function() {
  var a;

  for (var i=0, length=poor.length; i<length; i++) {
    if (typeof poor[i] == 'string' || typeof poor[i] == 'number') {
      continue;
    }

    a = new Yamb();

    a.stats.views = poor[i];
    a.stats.comments = poor[i];
    a.stats.likes = poor[i];

    assert(a, defaults.views, defaults.likes, defaults.comments);
  }
});