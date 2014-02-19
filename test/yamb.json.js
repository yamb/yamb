it('should works', function() {
  var a = new Yamb(data.create);
  var json = a.json();

  json.id.should.equal(a.id);
  json.title.should.equal(a.title);
  json.text.should.equal(a.text);
});

it('should return only updated values', function() {
  var a = new Yamb(data.create);
  a.title = 'New title';

  var json = a.json(true);

  json.should.not.be.empty;
  json.title.should.equal('New title');
});

it('should to be empty if nothing to change', function() {
  var a = new Yamb(data.create);
  var json = a.json(true);

  json.should.be.empty;
});

it('should always clone returned object', function() {
  var a = new Yamb(data.create);
  var json = a.json();

  json.should.not.equal(a.json());

  json.title = 'Title';
  json.title.should.not.equal(a.title);
});

it('should not have properties outside the schema', function() {
  var a = new Yamb({
    param1: 'value 1',
    param2: 'value 2',
    param3: ['obj 1', 'obj 2', 'obj 3']
  });

  var json = a.json();

  json.should.not.have.property('param1');
  json.should.not.have.property('param2');
  json.should.not.have.property('param3');
});