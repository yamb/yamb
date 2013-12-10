var options = require('./_data/options');
var schema = require('./_data/schema');
var data = require('./_data/data');

describe('Test post object', function() {
  var Yamb = require('./../lib/post/index')(options);

  it('default property', function() {
    var post = new Yamb();

    for (var i=0, length = schema.keys.length; i<length; i++) {
      post.should.have.property(schema.keys[i]);
    }

    post.created.should.be.an.instanceOf(Date);

    post.tags.should.be.an.instanceOf(Array);
    post.related.should.be.an.instanceOf(Array);

    post.snippets.should.be.an.instanceOf(Object);
    post.stats.should.be.an.instanceOf(Object);
  });

  it('updated property', function() {
    var post = new Yamb();
    post.update(data);

    post.should.have.property('slug', 'a-panhandlers-guide-to-business-life-love');
    post.should.have.property('title', "Pay People What They're Worth");

    post.tags.should.be.an.instanceOf(Array).and.have.length(1);
    post.tags.should.include('business');
  });
});