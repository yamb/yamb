import all from './all.js';

export default {
  name: Symbol.asyncIterator,

  fn(yamb) {
    return all.fn(yamb)[Symbol.asyncIterator]();
  }
};
