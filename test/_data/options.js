var options = {
  dbname: 'yamb-test',
  storage: require('./storage')
};

if (process.env.NODE_YAPI) {
  options.yapi = process.env.NODE_YAPI;
}

module.exports = options;