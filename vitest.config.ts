import { defineConfig, type ViteUserConfig } from 'vitest/config';

const config: ViteUserConfig = defineConfig({
  test: {
    include: ['test/*.test.ts'],
    environment: 'node',
    setupFiles: ['./test/_test-matchers.ts'],
    typecheck: { enabled: true, include: ['test/**/*.test-d.ts'] }
  }
});

export default config;
