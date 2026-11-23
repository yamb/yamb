export default {
  name: 'archived',

  get(yamb) {
    return yamb.all().archived();
  },
  set: false
};
