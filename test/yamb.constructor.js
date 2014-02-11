var poor = utils.unexpected({bool: true, arr: true, num: true, str: true});

it('should return an object with default properties', function() {
  var a = new Yamb();
  a.should.have.properties(schema.keys);
});

it('should return an object with isolated properties', function() {
  var a = new Yamb({id: 10, title: 'title for a'});
  var b = new Yamb({id: 20, title: 'title for b'});

  a.title.should.not.eql(b.title);
  a.id.should.not.eql(b.id);
});

it('should not update properties with unexpected values', function() {
  var a = new Yamb();
  a.should.have.property('title', '');

  var b;
  for (var i=0, length=poor.length; i<length; i++) {
    b = new Yamb(poor[i]);
    b.should.have.property('title', '');
  }
});

it('should not to have properties outside the schema', function() {
  var a = new Yamb({
    param1: 'value 1',
    param2: 'value 2',
    param3: ['obj 1', 'obj 2', 'obj 3']
  });

  a.should.not.have.property('param1');
  a.should.not.have.property('param2');
  a.should.not.have.property('param3');
});