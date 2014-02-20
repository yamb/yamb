it('should works', function() {
  var a = new Yamb();
  a.update(data('easymongo', true));

  var json = a.json();
  a.json(true).should.not.be.empty;

  a.reset();

  a.json(true).should.be.empty;
  a.json().should.eql(json);
});

it.skip('should reset related cache');