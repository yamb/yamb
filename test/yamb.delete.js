var should = require('should');
var co = require('co');

var data = require('./_data/data');

var Yamb = require('./helpers/yamb');

describe('Yamb delete()', function() {
  it('should return error if object new', function(done) {
    co(function *() {
      var post = new Yamb();
      var error = null;
      var result;

      try {
        result = yield post.remove();
      } catch (err) {
        error = err;
      }

      should(error).not.equal(null);
      should(error).be.an.instanceof(Error);
      should(result).not.be.ok;

      done();
    })();
  });

  it('should return error if object not saved yet', function(done) {
    co(function *() {
      var post = new Yamb();
      var error = null;
      var result;

      post.update(data.create);

      try {
        result = yield post.remove();
      } catch (err) {
        error = err;
      }

      should(error).not.equal(null);
      should(error).be.an.instanceof(Error);
      should(result).not.be.ok;

      done();
    })();
  });

  it('should remove object', function(done) {
    co(function *() {
      var post = new Yamb(data.create);

      var result = yield post.remove();

      result.should.be.true;

      done();
    })();
  });
  
  it('should remove newly created object', function(done) {
    co(function *() {
      var post = new Yamb();
      post.update(data.create);

      post = yield post.save();
      should(post).be.ok;

      var result = yield post.remove();
      result.should.be.true;

      done();
    })();
  });
});