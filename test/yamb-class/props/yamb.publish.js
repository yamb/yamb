var poor = utils.unexpected({bool: true, arr: true, num: true, str: true});
var datetime = '2013-12-17 1:52';

function assert(a, date) {
  a.publish.should.be.an.instanceof(Date);
  a.publish.toISOString.should.be.type('function');

  utils.dateConvert(a.publish).should.equal(utils.dateConvert(date));
}

it('should works', function() {
  var a = new Yamb();
  a.publish.should.be.false;
});

it('should work with string', function() {
  var a = new Yamb({publish: datetime});
  assert(a, new Date(datetime));

  var b = new Yamb();
  b.publish = datetime;
  assert(b, new Date(datetime));
});

it('should work with object', function() {
  var date = new Date(datetime);

  var a = new Yamb({publish: date});
  assert(a, date);

  var b = new Yamb();
  b.publish = date;
  assert(b, date);
});

it('should to know if date updated (from false to date)', function() {
  var json;
  var a = new Yamb();

  json = a.json(true);

  json.should.be.empty;

  a.publish = datetime;
  json = a.json(true);

  json.should.not.be.empty;
  json.should.have.property('publish');
});

it('should to know if date updated (from date to date)', function() {
  var json;
  var date = new Date(datetime);
  var a = new Yamb({publish: datetime});

  a.publish = date;
  json = a.json(true);

  json.should.be.empty;

  a.publish = new Date();
  json = a.json(true);

  json.should.not.be.empty;
  json.should.have.property('publish');
});

it('should not update with unexpected values from constructor', function() {
  var a;

  for (var i=0, length=poor.length; i<length; i++) {
    a = new Yamb({publish: poor[i]});
    a.publish.should.be.false;
  }
});

it('should not update with unexpected values from setter', function() {
  var a, date;

  for (var i=0, length=poor.length; i<length; i++) {
    a = new Yamb();

    date = a.publish;
    a.publish = poor[i];

    a.publish.should.be.false;
  }
});