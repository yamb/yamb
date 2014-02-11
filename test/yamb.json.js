it('should works', function() {
  var a = new Yamb(data.create);
  var json = a.json();

  json.should.not.equal(a.json());

  json.title = 'Title';
  json.title.should.not.equal(a.title);

  json.created.should.be.an.instanceof(Date);
  json.created.toISOString.should.be.type('function');
});

it('should not have properties outside the schema', function() {
  var a = new Yamb({
    param1: 'value 1',
    param2: 'value 2',
    param3: ['obj 1', 'obj 2', 'obj 3']
  });

  var json = a.json();

  a.should.not.have.property('param1');
  a.should.not.have.property('param2');
  a.should.not.have.property('param3');
});