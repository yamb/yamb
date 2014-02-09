var options = {
  storage: require('./storage')
};

if (process.env.yapi) {
  options.yapi = process.env.yapi;
}

module.exports = options;