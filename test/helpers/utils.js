var pad = exports.pad = function(num) {
  if (num < 10) {
    return '0' + num;
  } else {
    return num;
  }
};

exports.yambUri = function(date, slug) {
  var uri = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    slug
  ];

  return '/' + uri.join('/');
};

var dummy = exports.dummy = function() {};

exports.unexpected = function(params) {
  var poor = [
    undefined,
    NaN,
    null,
    '',
    '  ',
    [],
    {},
    {'foo': 'bar'},
    dummy
  ];

  if (params) {
    if (params.bool) {
      poor.push(true);
      poor.push(false);
    }

    if (params.arr) {
      poor.push([0, 10, -10]);
      poor.push(['foo', 'bar']);
      poor.push([{'foo': 'bar'}, {'baz': 'qux'}]);
    }

    if (params.num) {
      poor.push(0);
      poor.push(10);
      poor.push(-10);
    }

    if (params.str) {
      poor.push('foo bar');
    }
  }

  return poor;
};