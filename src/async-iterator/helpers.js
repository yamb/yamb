import {
  dropAsync,
  everyAsync,
  filterAsync,
  findAsync,
  flatMapAsync,
  forEachAsync,
  mapAsync,
  reduceAsync,
  someAsync,
  takeAsync
} from './operators.js';

function callback(name, fn) {
  if (typeof fn !== 'function') {
    throw new TypeError(`${name}: argument must be a function`);
  }

  return fn;
}

function count(name, n) {
  const value = Number(n);

  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name}: argument must be a non-negative finite number`);
  }

  return Math.floor(value);
}

export default [
  { name: 'map', lazy: true, check: callback, run: mapAsync },
  { name: 'filter', lazy: true, check: callback, run: filterAsync },
  { name: 'flatMap', lazy: true, check: callback, run: flatMapAsync },
  { name: 'take', lazy: true, check: count, run: takeAsync },
  { name: 'drop', lazy: true, check: count, run: dropAsync },
  { name: 'toArray', run: (source) => Array.fromAsync(source) },
  { name: 'forEach', check: callback, run: forEachAsync },
  { name: 'reduce', check: callback, run: reduceAsync },
  { name: 'some', check: callback, run: someAsync },
  { name: 'every', check: callback, run: everyAsync },
  { name: 'find', check: callback, run: findAsync }
];
