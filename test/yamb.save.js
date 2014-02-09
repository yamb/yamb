var should = require('should');
var co = require('co');

var utils = require('./helpers/utils');
var data = require('./_data/data');

var Yamb = require('./helpers/yamb');

describe('Yamb save()', function() {
  it('should throw error if only title exists', function(done) {
    co(function *() {
      var post = new Yamb();
      var error = null;

      post.title = 'title';

      try {
        post = yield post.save();
      } catch (err) {
        post = false;
        error = err;
      }

      should(error).not.equal(null);
      should(error).be.an.instanceOf(Error);
      should(post).not.be.ok;

      done();
    })();
  });

  it('should throw error if only preview/text exists', function(done) {
    co(function *() {
      var post = new Yamb();
      var error = null;

      post.text = ' \n\n text 1\n\ntext 2   \n\n\n  \n \n  ';

      try {
        post = yield post.save();
      } catch (err) {
        post = false;
        error = err;
      }

      should(error).not.equal(null);
      should(error).be.an.instanceOf(Error);
      should(post).not.be.ok;

      done();
    })();
  });

  it('should throw error if only uri exists', function(done) {
    co(function *() {
      var post = new Yamb();
      var error = null;

      post.uri = 'what\'s new in 2014 year';

      try {
        post = yield post.save();
      } catch (err) {
        post = false;
        error = err;
      }

      should(error).not.equal(null);
      should(error).be.an.instanceOf(Error);
      should(post).not.be.ok;

      done();
    })();
  });

  it('should get uri from yandex translate', function(done) {
    co(function *() {
      var post = new Yamb();

      post.title = 'Заголовок 2014';
      post.text = ' \n\n text 1\n\ntext 2   \n\n\n  \n \n  ';

      post = yield post.save();

      should(post).be.ok;

      post.id.should.equal(10);
      post.uri.should.equal(utils.yambUri(post.created, 'title-2014'));
      post.preview.should.equal('text 1');
      post.text.should.equal('text 1\n\ntext 2');

      done();
    })();
  });

  it('should work for new data', function(done) {
    co(function *() {
      var post = new Yamb();
      post.update(data.create);

      post = yield post.save();

      should(post).be.ok;

      post.id.should.equal(10);
      post.uri.should.equal(utils.yambUri(post.created, 'a-panhandlers-guide-to-business-life-love'));
      post.title.should.equal('Pay People What They’re Worth');

      done();
    })();
  });

  it('should work for updated data', function(done) {
    co(function *() {
      var post = new Yamb(data.update);

      post.created.should.be.an.instanceof(Date);
      post.created.toISOString.should.be.type('function');

      post.tags.push('marketing');
      post.active = false;

      post = yield post.save();

      should(post).be.ok;

      post.id.should.equal(data.update._id);
      post.uri.should.equal(data.update.uri);
      post.title.should.equal(data.update.title);
      post.preview.should.equal(data.update.preview);
      post.text.should.equal(data.update.text);
      post.tags.should.containEql('business');
      post.tags.should.containEql('marketing');
      post.active.should.equal(false);

      done();
    })();
  });
});