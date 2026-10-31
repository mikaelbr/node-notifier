import { defineConfig, type ViteUserConfig } from 'vitest/config';

// Integration tests spawn the real notifier binaries, so they only run on the
// matching OS and need a notification daemon (see .github/workflows/integration.yml).
const config: ViteUserConfig = defineConfig({
  test: {
    include: ['test/integration/*.test.ts'],
    environment: 'node',
    testTimeout: 30000
  }
});

export default config;
