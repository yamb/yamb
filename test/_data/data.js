exports.create = {
  id: 100,
  slug: 'A Panhandlers Guide to Business, Life & Love',
  title: "Pay People What They're Worth",
  video: ['youtube player', 'vimeo player'],
  text: " I spend my days \"dashing\" from meeting to meeting, putting out fires, returning phone calls. I spend my meetings **reviewing designs**, **assessing concepts** and **directing my team**.  \n\n\n I spend my mornings reading the Wall Street Journal and my evenings watching the news.\nI'd say I'm *connected*. I'd say I'm successful. I'd say I'm spent!\n\nI drive to work. On a good day it's thirty minutes each way. On a bad day it's an hour and thirty minutes. If I leave early enough I can get there in twenty minutes (c) - now that's time management. \n\n  ",
  author: 'Alexey Simonenko',
  params: 'more parameters',
  tags: 'business',
  stats: {
    views: '10',
    unique: 5
  }
};

exports.update = {
  _id: 100,
  slug: 'a-panhandlers-guide-to-business-life-love',
  title: "Pay People What They’re Worth",
  video: ['youtube player', 'vimeo player'],
  preview: "I spend my days «dashing» from meeting to meeting, putting out fires, returning phone calls. I spend my meetings **reviewing designs**, **assessing concepts** and **directing my team**.",
  text: "I spend my mornings reading the Wall Street Journal and my evenings watching the news.\nI’d say I’m *connected*. I’d say I’m successful. I’d say I’m spent!\n\nI drive to work. On a good day it’s thirty minutes each way. http://simonenko.su for more info. On a bad day it’s an hour and thirty minutes. If I leave early enough I can get there in twenty minutes © — now that’s time management.",
  author: {
    name: 'Alexey Simonenko',
    email: 'alexey@simonenko.su'
  },
  params: 'more parameters',
  tags: ['business'],
  created: '2013-12-23 18:59',
  active: true,
  stats: {
    views: 10,
    likes: 5,
    comments: 20
  }
};