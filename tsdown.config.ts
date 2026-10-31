import { defineConfig, type UserConfig } from 'tsdown';

// Unbundled, so dist/ mirrors src/: every notifier is its own entry for
// `node-notifier/notifiers/*`, and paths to vendor/ resolve the same from both.
const config: UserConfig = defineConfig({
  entry: ['src/**/*.ts'],
  unbundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node22.22',
  dts: true,
  sourcemap: true,
  fixedExtension: false
});

export default config;
