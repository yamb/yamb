import { cpus, totalmem } from 'node:os';
import { performance } from 'node:perf_hooks';

const WARMUP = 3;
const SAMPLES = 21;

export function conditions(t) {
  t.diagnostic(
    JSON.stringify({
      kind: 'conditions',
      node: process.version,
      v8: process.versions.v8,
      platform: process.platform,
      arch: process.arch,
      cpu: cpus()[0]?.model,
      logicalCpus: cpus().length,
      totalMemoryBytes: totalmem(),
      execArgv: process.execArgv,
      warmup: WARMUP,
      samples: SAMPLES,
      gc: typeof globalThis.gc === 'function',
      timing: 'batch latency / operations; p95 is nearest-rank over 21 batches',
      memory:
        'process snapshots include garbage; retained heap measured separately with --expose-gc'
    })
  );
}

export async function measure(t, name, run, operations = 1) {
  for (let i = 0; i < WARMUP; i++) {
    await run();
  }
  const before = process.memoryUsage();
  const times = [];
  let result;
  for (let i = 0; i < SAMPLES; i++) {
    const start = performance.now();
    result = run();
    if (result instanceof Promise) {
      result = await result;
    }
    times.push(((performance.now() - start) * 1e6) / operations);
  }
  const after = process.memoryUsage();
  times.sort((a, b) => a - b);
  const medianNs = times[Math.floor(times.length / 2)];
  t.diagnostic(
    JSON.stringify({
      kind: 'measurement',
      name,
      operationsPerSample: operations,
      medianNs,
      p95Ns: times[Math.ceil(times.length * 0.95) - 1],
      operationsPerSecond: 1e9 / medianNs,
      samplesNs: times,
      memoryBefore: before,
      memoryAfter: after
    })
  );
  return result;
}

export function retained(t, name, create, count = 10_000) {
  if (typeof globalThis.gc !== 'function') {
    t.diagnostic(
      JSON.stringify({ kind: 'retained', name, status: 'unavailable: use --expose-gc' })
    );
    return;
  }
  globalThis.gc();
  const before = process.memoryUsage();
  const objects = Array.from({ length: count }, (_, i) => create(i));
  globalThis.gc();
  const after = process.memoryUsage();
  t.diagnostic(
    JSON.stringify({
      kind: 'retained',
      name,
      count,
      heapBytesPerObject: (after.heapUsed - before.heapUsed) / count,
      memoryBefore: before,
      memoryAfter: after,
      liveObjects: objects.length
    })
  );
  return objects;
}
