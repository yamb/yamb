import close from './close.js';

export default {
  name: Symbol.asyncDispose,

  fn(yamb) {
    return close.fn(yamb);
  }
};
