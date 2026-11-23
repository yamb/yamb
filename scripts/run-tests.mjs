import { spawnSync } from 'node:child_process';
import { glob, mkdir } from 'node:fs/promises';

const args = ['--test', '--test-concurrency=1'];

if (process.argv.includes('--coverage')) {
  await mkdir('coverage', { recursive: true });
  args.push(
    '--experimental-test-coverage',
    '--test-coverage-include=src/**/*.js',
    '--test-coverage-include-all',
    '--test-reporter=spec',
    '--test-reporter-destination=stdout',
    '--test-reporter=lcov',
    '--test-reporter-destination=coverage/lcov.info'
  );
}

const files = await Array.fromAsync(glob('test/**/*.test.js', { exclude: ['test/perf/**'] }));
const result = spawnSync(process.execPath, [...args, ...files], {
  stdio: 'inherit'
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
