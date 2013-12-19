var should = require('should');

var options = require('./_data/options');
var data = require('./_data/data');

describe('Yamb delete()', function() {
  var Yamb = require('./../lib/yamb/index')(options);

  it('should return error if object new', function(done) {
    var post = new Yamb();

    post.remove(function(error, result) {
      should(error).not.equal(null);
      should(error).be.an.instanceof(Error);
      should(result).not.be.ok;

      done();
    });
  });

  it('should return error if object not saved yet', function(done) {
    var post = new Yamb();
    post.update(data);

    post.remove(function(error, result) {
      should(error).not.equal(null);
      should(error).be.an.instanceof(Error);
      should(result).not.be.ok;

      done();
    });
  });

  it('should remove object', function(done) {
    var post = new Yamb(data);

    post.remove(function(error, result) {
      should(error).equal(null);
      result.should.be.true;

      done();
    });
  });
});