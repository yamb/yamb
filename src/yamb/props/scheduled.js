export default {
  name: 'scheduled',

  get(yamb) {
    return yamb.all().scheduled();
  },
  set: false
};
