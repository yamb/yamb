function remove(params, fn) {
  setImmediate(function() {
    fn(null, true);
  });
}

function removeById(id, fn) {
  setImmediate(function() {
    fn(null, true);
  });
}

function save(params, fn) {
  setImmediate(function() {
    if (!params._id && !params.id) {
      params._id = 10;
    }

    params.gc = 'gc';
    fn(null, params);
  });
}

module.exports = {
  find: function(params, options) {},

  findById: function(id) {},

  remove: function(params) {
    return function(fn) {
      remove(params, fn);
    };
  },

  removeById: function(id) {
    return function(fn) {
      removeById(id, fn);
    };
  },

  save: function(params) {
    return function(fn) {
      save(params, fn);
    };
  }
};