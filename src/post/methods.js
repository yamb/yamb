import archive from './methods/archive.js';
import changes from './methods/changes.js';
import hash from './methods/hash.js';
import publish from './methods/publish.js';
import remove from './methods/remove.js';
import save from './methods/save.js';
import schedule from './methods/schedule.js';
import toJSON from './methods/to-json.js';
import url from './methods/url.js';

export default [save, publish, archive, schedule, remove, url, toJSON, hash, changes];
