var poor = utils.unexpected({bool: true, arr: true, num: true, str: true});
var datetime = '2013-12-17 1:52';

function convert(o) {
  var date = [
    o.getFullYear(),
    o.getMonth(),
    o.getDate()
  ];

  var time = [
    o.getHours(),
    o.getMinutes()
  ];

  return date.join('-') + ' ' + time.join(':');
}

function assert(a, date) {
  a.created.should.be.an.instanceof(Date);
  a.created.toISOString.should.be.type('function');

  convert(a.created).should.equal(convert(date));
}

it('should works', function() {
  var a = new Yamb();
  assert(a, new Date());
});

it('should work with string', function() {
  var a = new Yamb({created: datetime});
  assert(a, new Date(datetime));
});

it('should work with object', function() {
  var date = new Date(datetime);
  var a = new Yamb({created: date});
  assert(a, date);
});

it('should not to have a setter', function() {
  var a = new Yamb();

  (function() {
    a.update({created: datetime});
  }).should.throw();

  var date = a.created;
  a.created = datetime;
  assert(a, date);
});

it('should not update with unexpected values from constructor', function() {
  var a;

  for (var i=0, length=poor.length; i<length; i++) {
    a = new Yamb({created: poor[i]});
    assert(a, new Date());
  }
});

it('should not update with unexpected values from setter', function() {
  var a, date;

  for (var i=0, length=poor.length; i<length; i++) {
    a = new Yamb();

    date = a.created;
    a.created = poor[i];

    assert(a, date);
  }
});