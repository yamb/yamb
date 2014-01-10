var co = require('co');
var should = require('should');

var options = require('./_data/options');
var data = require('./_data/data');

describe('Yamb EMT typographer', function() {
  var Yamb = require('./../lib/yamb/index')(options);

  it('should update title', function(done) {
    co(function *() {
      var post = new Yamb();
      post.update(data.create);

      post.title = '"May the force be with you."';

      post = yield post.save();

      should(post).be.ok;
      post.title.should.equal('«May the force be with you.»');

      done();
    })();
  });

  it('should update text with preview', function(done) {
    co(function *() {
      var post = new Yamb();
      post.update(data.create);

      post.preview = '"The force" - is a magical power that gives people strength.';
      post.text = '"The force" - is a magical power that gives people strength.';

      post = yield post.save();

      should(post).be.ok;
      post.preview.should.equal('«The force» — is a magical power that gives people strength.');
      post.text.should.equal('«The force» — is a magical power that gives people strength.');

      done();
    })();
  });
});