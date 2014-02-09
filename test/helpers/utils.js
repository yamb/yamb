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