export default {
  name: 'published',

  get(yamb) {
    return yamb.all().published();
  },
  set: false
};
