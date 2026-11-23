import { readField, writeField } from '../lib/field.js';

export default {
  name: 'options',

  validate(state, value) {
    return state.optionsConfig.validate(value);
  },

  get(post) {
    return readField(post, this);
  },

  set(post, value) {
    writeField(post, this, value);
  }
};
