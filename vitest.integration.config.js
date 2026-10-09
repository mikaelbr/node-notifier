import { defineConfig } from 'vitest/config';

// Integration tests spawn the real notifier binaries, so they only run on the
// matching OS and need a notification daemon (see .github/workflows/integration.yml).
export default defineConfig({
  test: {
    include: ['test/integration/*.js'],
    environment: 'node',
    testTimeout: 30000
  }
});
