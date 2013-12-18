var should = require('should');

var options = require('./_data/options');
var data = require('./_data/data');

describe('Yamb save method', function() {
  var Yamb = require('./../lib/yamb/index')(options);

  it('should throw error if only title exists', function(done) {
    var post = new Yamb();
    post.title = 'title';

    post.save(function(error, result) {
      should(error).not.equal(null);
      should(error).be.an.instanceOf(Error);
      should(result).not.be.ok;

      done();
    });
  });

  it('should throw error if only preview/text exists', function(done) {
    var post = new Yamb();
    post.text = ' \n\n text 1\n\ntext 2   \n\n\n  \n \n  ';

    post.save(function(error, result) {
      should(error).not.equal(null);
      should(error).be.an.instanceOf(Error);
      should(result).not.be.ok;

      done();
    });
  });

  it('should throw error if slug not exists', function(done) {
    var post = new Yamb();
    post.title = 'title';
    post.text = ' \n\n text 1\n\ntext 2   \n\n\n  \n \n  ';

    post.save(function(error, result) {
      should(error).not.equal(null);
      should(error).be.an.instanceOf(Error);
      should(result).not.be.ok;

      done();
    });
  });

  it('should throw error if only slug exists', function(done) {
    var post = new Yamb();
    post.slug = 'what\'s new in 2014 year';

    post.save(function(error, result) {
      should(error).not.equal(null);
      should(error).be.an.instanceOf(Error);
      should(result).not.be.ok;

      done();
    });
  });

  it('should work for new data', function(done) {
    var post = new Yamb();
    post.update(data);

    post.save(function(error, result) {
      should(error).equal(null);

      result.id.should.equal(10);
      result.slug.should.equal('a-panhandlers-guide-to-business-life-love');
      result.title.should.equal('Pay People What They\'re Worth');

      done();
    });
  });

  it('should work for updated data', function(done) {
    var post = new Yamb();
    var json = post.update(data).toJson();

    json.id = 100;
    var post = new Yamb(json);

    post.save(function(error, result) {
      should(error).equal(null);

      result.id.should.equal(100);
      result.slug.should.equal('a-panhandlers-guide-to-business-life-love');
      result.title.should.equal('Pay People What They\'re Worth');

      done();
    });
  });
});