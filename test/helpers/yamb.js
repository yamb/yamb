var mongo = require('co-easymongo')({dbname: 'yamb-test'});
var yamb = require('./../../lib/yamb');

module.exports = function(yapi) {
  var options = {
    storage: mongo.collection('yamb')
  };

  if (yapi && process.env.yapi) {
    options.yapi = process.env.yapi;
  }

  return yamb(options);
};