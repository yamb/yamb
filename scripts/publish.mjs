import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const registry = new URL('https://npm.pkg.github.com/');

async function published(name, version, token, integrity, length) {
  const get = (url) =>
    fetch(url, {
      headers: url.origin === registry.origin ? { authorization: `Bearer ${token}` } : {},
      signal: AbortSignal.timeout(15_000)
    });

  const response = await get(new URL(encodeURIComponent(name), registry));

  if (response.status === 404) {
    return false;
  }

  assert.ok(response.ok, `GitHub Packages metadata failed (${response.status})`);

  const { versions } = await response.json();
  const current = versions?.[version];

  if (!current) {
    return false;
  }

  const { dist } = current;
  assert.ok(dist?.tarball, 'Published version lacks a tarball');

  if (dist.integrity) {
    assert.equal(dist.integrity, integrity, 'Published package has different integrity');
  }

  const url = new URL(dist.tarball);
  assert.ok(
    url.protocol === 'https:' && !url.username && !url.password,
    'Invalid registry tarball URL'
  );

  const artifact = await get(url);
  assert.ok(artifact.ok && artifact.body, `GitHub Packages download failed (${artifact.status})`);

  const hash = createHash('sha512');
  let size = 0;

  for await (const chunk of artifact.body) {
    size += chunk.length;
    assert.ok(size <= length, 'Published tarball has different bytes');
    hash.update(chunk);
  }

  assert.equal(size, length, 'Published tarball has different bytes');
  assert.equal(
    `sha512-${hash.digest('base64')}`,
    integrity,
    'Published tarball has different bytes'
  );
  return true;
}

async function publish(input, digest, mode) {
  assert.ok(mode === undefined || mode === '--dry-run', 'Unknown publication mode');

  const archive = resolve(input);
  const bytes = await readFile(archive);
  assert.equal(
    `sha256:${createHash('sha256').update(bytes).digest('hex')}`,
    digest,
    'Archive digest differs'
  );
  const integrity = `sha512-${createHash('sha512').update(bytes).digest('base64')}`;

  const { name, version } = JSON.parse(await readFile('package.json', 'utf8'));
  const packed = JSON.parse(execFileSync('tar', ['-xOzf', archive, 'package/package.json']));
  assert.equal(packed.name, name, 'Archive package name differs');
  assert.equal(packed.version, version, 'Archive package version differs');

  const token = process.env.GITHUB_TOKEN;
  const verify = () => published(name, version, token, integrity, bytes.length);

  if (!mode) {
    assert.ok(token, 'GitHub Packages authentication is required');

    if (await verify()) {
      console.log(`${name}@${version} already holds the verified tarball`);
      return;
    }
  }

  const directory = await mkdtemp(join(tmpdir(), 'yamb-publish-'));
  const args = [
    'publish',
    archive,
    '--registry',
    registry.href,
    '--no-git-checks',
    '--ignore-scripts'
  ];

  if (mode) {
    args.push(mode);
  }

  let result;

  try {
    result = spawnSync('pnpm', args, { cwd: directory, stdio: 'inherit', timeout: 90_000 });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }

  if (mode) {
    assert.ifError(result.error);
    assert.equal(result.status, 0, 'Publication rehearsal failed');
    return;
  }

  for (let attempt = 0; attempt < 15; attempt++) {
    if (await verify()) {
      console.log(`${name}@${version} holds the verified tarball`);
      return;
    }

    await delay(2_000);
  }

  throw new Error('GitHub Packages did not return the verified tarball', { cause: result.error });
}

await publish(process.argv[2], process.argv[3], process.argv[4]);
