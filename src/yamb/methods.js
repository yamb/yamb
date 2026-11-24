import all from './methods/all.js';
import asyncDispose from './methods/async-dispose.js';
import asyncIterator from './methods/async-iterator.js';
import build from './methods/build.js';
import close from './methods/close.js';
import create from './methods/create.js';
import fence from './methods/fence.js';
import fetch from './methods/fetch.js';
import find from './methods/find.js';
import has from './methods/has.js';
import identify from './methods/identify.js';
import locate from './methods/locate.js';
import open from './methods/open.js';
import render from './methods/render.js';
import sync from './methods/sync.js';
import uri from './methods/uri.js';

export default [
  open,
  close,
  sync,
  fetch,
  find,
  all,
  build,
  create,
  fence,
  render,
  uri,
  locate,
  identify,
  has,
  asyncDispose,
  asyncIterator
];
