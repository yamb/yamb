var poor = utils.unexpected({bool: true, arr: true, num: true, str: true});

it('should works', function() {
  var a = new Yamb();
  a.update(data.create);

  a.uri.should.equal(utils.yambUri(a.created, 'a-panhandlers-guide-to-business-life-love'));
  a.title.should.equal("Pay People What They're Worth");

  a.tags.should.be.an.instanceof(Array).and.have.length(1);
  a.tags.should.include('business');
});

it('should not update properties with unexpected values', function() {
  var a = new Yamb();
  var json = a.json();

  for (var i=0, length=poor.length; i<length; i++) {
    a.update(poor[i]);
    a.json().should.eql(json);
  }
});

it('should not have properties outside the schema', function() {
  var a = new Yamb();
  a.update(data.create);

  a.id.should.be.false;
  a.should.not.have.property('video');
  a.should.not.have.property('params');
});