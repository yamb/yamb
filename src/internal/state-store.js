export function store(label) {
  const states = new WeakMap();

  return {
    set(instance, state) {
      states.set(instance, state);
    },

    get(instance) {
      const state = states.get(instance);

      if (state === undefined && !states.has(instance)) {
        throw new Error(`${label} state not initialized`);
      }

      return state;
    }
  };
}
