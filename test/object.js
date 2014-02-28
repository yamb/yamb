describe('Yamb object', function() {
  var data = require('./data');
  var yamb = require('./helpers/yamb')(true, true);

  before(function *() {
    var r = yield yamb.remove();
  });

  it('should create', function() {
    var a = yamb.create(data('easymongo', true));

    a.should.be.an.instanceof(Object);
    a.constructor.name.should.equal('Yamb');
  });

  it('should fetch', function *() {
    var b;

    var a = yamb.create(data('twtcst', true));
    a = yield a.reset().update({uri: a.title}).save();

    b = yield yamb.fetch();

    b.constructor.name.should.equal('Yamb');
    b.id.should.not.false;

    b = yield yamb.fetch({title: 'easymongo'});
    b.should.be.false;
  });

  it('should fetchAll', function *() {
    var ab;
    var params = data('twtcst', true);

    params.title = params.title + ' 1';
    var a = yamb.create(params);
    a = yield a.reset().update({uri: a.title}).save();

    params.title = params.title + ' 2';
    var b = yamb.create(params);
    b = yield b.reset().update({uri: a.title}).save();

    ab = yield yamb.fetchAll();
    ab.should.be.an.instanceof(Array).and.have.length(3);
    ab[0].title.should.equal('The easiest MongoDB API 1 2');
    ab[1].title.should.equal('The easiest MongoDB API 1');
    ab[2].title.should.equal('The easiest MongoDB API');

    ab = yield yamb.fetchAll({'author.name': 'Alexey Simonenko'}, {sort: 'title'});
    ab.should.be.an.instanceof(Array).and.have.length(3);
    ab[0].title.should.equal('The easiest MongoDB API');
    ab[1].title.should.equal('The easiest MongoDB API 1');
    ab[2].title.should.equal('The easiest MongoDB API 1 2');

    ab = yield yamb.fetchAll({'author.name': 'Alexey Simonenko'}, {limit: 1});
    ab.should.be.an.instanceof(Array).and.have.length(1);
    ab[0].title.should.equal('The easiest MongoDB API 1 2');

    ab = yield yamb.fetchAll({'title': 'easymongo'});
    ab.should.be.an.instanceof(Array).and.have.length(0);
  });

  it('should remove', function *() {
    var ab;

    ab = yield yamb.fetchAll();
    ab.should.be.an.instanceof(Array).and.have.length(3);

    var r = yield yamb.remove();
    r.should.be.true;

    ab = yield yamb.fetchAll();
    ab.should.be.an.instanceof(Array).and.have.length(0);
  });
});