var should = require('should');

var options = require('./_data/options');
var data = require('./_data/data');

describe('Yamb EMT typographer', function() {
  var Yamb = require('./../lib/yamb/index')(options);

  it('should update title', function(done) {
    var post = new Yamb();
    post.update(data);

    post.title = '"May the force be with you."';

    post.save(function(error, result) {
      should(error).equal(null);
      should(result).be.ok;

      result.title.should.equal('«May the force be with you.»');

      done();
    });
  });

  it('should update text with preview', function(done) {
    var post = new Yamb();
    post.update(data);

    post.preview = '"The force" - is a magical power that gives people strength.';
    post.text = '"The force" - is a magical power that gives people strength.';

    post.save(function(error, result) {
      should(error).equal(null);
      should(result).be.ok;

      result.preview.should.equal('«The force» — is a magical power that gives people strength.');
      result.text.should.equal('«The force» — is a magical power that gives people strength.');

      done();
    });
  });
});