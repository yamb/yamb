var methods = ['html', 'json', 'remove', 'save', 'similar', 'update'];

it('should not be overridable', function() {
  var a = new Yamb();
  var method;

  for (var i=0, length=methods.length; i<length; i++) {
    method = a[methods[i]];
    a[methods[i]] = utils.dummy;
    a[methods[i]].should.equal(method);
  }
});

it('should not be configurable', function() {
  for (var i=0, length=methods.length; i<length; i++) {
    (function() {
      Object.defineProperty(Yamb.prototype, methods[i], {
        value: utils.dummy
      });
    }).should.throw();
  }
});