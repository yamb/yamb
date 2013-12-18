function remove(table, params, fn) {
  setImmediate(function() {
    fn(null, true);
  });
}

function removeById(table, id, fn) {
  setImmediate(function() {
    fn(null, true);
  });
}

function save(table, params, fn) {
  setImmediate(function() {
    if (!params._id && !params.id) {
      params._id = 10;
    }

    params.gc = 'gc';
    fn(null, params);
  });
}

module.exports = {
  find: function(table, params, options) {},

  remove: function(table, params) {
    return function(fn) {
      remove(table, params, fn);
    };
  },

  removeById: function(table, id) {
    return function(fn) {
      remove(table, id, fn);
    };
  },

  save: function(table, params) {
    return function(fn) {
      save(table, params, fn);
    };
  }
};