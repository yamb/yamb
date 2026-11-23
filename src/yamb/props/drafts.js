export default {
  name: 'drafts',

  get(yamb) {
    return yamb.all().drafts();
  },
  set: false
};
