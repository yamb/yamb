import archive from './methods/archive.js';
import changes from './methods/changes.js';
import hash from './methods/hash.js';
import next from './methods/next.js';
import prev from './methods/prev.js';
import publish from './methods/publish.js';
import related from './methods/related.js';
import remove from './methods/remove.js';
import render from './methods/render.js';
import save from './methods/save.js';
import schedule from './methods/schedule.js';
import toJSON from './methods/to-json.js';
import url from './methods/url.js';

export default [
  save,
  publish,
  archive,
  schedule,
  remove,
  render,
  url,
  next,
  prev,
  related,
  toJSON,
  hash,
  changes
];
