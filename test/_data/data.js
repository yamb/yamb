var data = {};

data.easymongo = {
  create: {
    id: '52fbd292bf40402a959381e3',
    uri: '/2013/12/the-easiest-mongodb-api',
    title: 'The easiest MongoDB API',
    preview: 'A **small** tweaks for the [native MongoDB driver](https://github.com/mongodb/node-mongodb-native).',
    text: "It's like native MongoDB driver but for newbie. In my opinion native driver has many difficulties. And for general purpose no need to be so flexible.\n\n**Benefits:**\n\n* Expected return data\n* Using strings for ObjectID values\n* `Collection` class for all manipulates with collections\n* Additional methods for work with id like `findById`, `removeById`\n* Less callbacks\n\n**Example:**\n\n```js\nvar users = mongo.collection('users');\n\nusers.find(function(err, res) {\n  console.log(res);\n});\n```",
    author: {name: 'Alexey Simonenko', email: 'alexey@simonenko.su', url: 'http://twitter.com/oknenomis'},
    tags: ['mongodb', 'nodejs', 'coffeescript'],
    stats: {views: 110, likes: 15, comments: 4},
    created: new Date('2013-12-23 18:59:50'),
    publish: new Date('2013-12-25 18:59:50'),
    active: true
  },

  update: {
    uri: 'The easiest MongoDB API',
    title: 'The easiest MongoDB API',
    text: "A small tweaks for the [native MongoDB driver](https://github.com/mongodb/node-mongodb-native).\n\nIt's like native MongoDB driver but for newbie. In my opinion native driver has many difficulties. And for general purpose no need to be so flexible.\n\n**Benefits:**\n\n* Expected return data\n* Using strings for ObjectID values\n* `Collection` class for all manipulates with collections\n* Additional methods for work with id like `findById`, `removeById`\n* Less callbacks\n\n**Example:**\n\n```js\nvar users = mongo.collection('users');\n\nusers.find(function(err, res) {\n  console.log(res);\n});\n```",
    author: 'Alexey Simonenko',
    tags: 'mongodb',
    stats: {views: '110', likes: '15', comments: '4'}
  }
};

data.tumblr = {
  create: {
    id: '52fbd337214feb5195ed98bd',
    uri: '/2013/12/node-tumblr',
    title: 'node-tumblr',
    preview: 'A node.js wrapper for the [Tumblr API v2](http://www.tumblr.com/docs/en/api/v2).',
    text: "### Contributing\n\n**DO NOT directly modify the `lib` files.** These files are automatically built from CoffeeScript sources located under the `src` directory.\n\nTo do build run:\n\n```bash\n$ cake build\n```",
    author: {name: 'Alexey Simonenko', email: 'alexey@simonenko.su', url: 'http://twitter.com/oknenomis'},
    tags: ['tumblr', 'nodejs', 'coffeescript'],
    stats: {views: 5, likes: 0, comments: 2},
    created: new Date('2014-01-03 18:59:50'),
    publish: new Date('2014-01-04 18:59:50'),
    active: true
  },

  update: {
    title: 'node-tumblr',
    text: "A node.js wrapper for the [Tumblr API v2](http://www.tumblr.com/docs/en/api/v2).\n\n### Contributing\n\n**DO NOT directly modify the `lib` files.** These files are automatically built from CoffeeScript sources located under the `src` directory.\n\nTo do build run:\n\n```bash\n$ cake build\n```",
    author: 'Alexey Simonenko',
    tags: 'tumblr, nodejs, coffeescript',
  }
};

data.unexpected = {
  create: {
    _id: 100,
    uri: '/2013/12/title-for-bad-article',
    title: 'Title for bad article',
    video: ['youtube player', 'vimeo player'],
    text: 'Text for bad article',
    author: {name: 'Alexey Simonenko', email: 'alexey@simonenko.su', url: 'http://twitter.com/oknenomis'},
    params: 'more parameters',
    tags: ['javascript'],
    created: '2013-12-23 18:59',
    stats: {views: 10, likes: 5, comments: 20}
  },

  update: {
    title: 'Title for bad article',
    video: ['youtube player', 'vimeo player'],
    text: ' Text for bad article\n\n  ',
    author: 'Alexey Simonenko',
    params: 'more parameters',
    tags: 'javascript',
    stats: {views: '10', unique: 5}
  }
}

module.exports = function(name, update) {
  if (update === true) {
    return data[name].update;
  } else {
    return data[name].create;
  }
};