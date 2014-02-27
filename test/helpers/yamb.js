var mongo = require('co-easymongo')({dbname: 'yamb-test'});

var obj = require('./../../lib');
var cls = require('./../../lib/yamb');

module.exports = function(all, yapi) {
  var options = {
    storage: mongo.collection('yamb')
  };

  if (yapi && process.env.yapi) {
    options.yapi = process.env.yapi;
  }

  if (all === true) {
    return obj(options);
  } else {
    return cls(options);
  }
};