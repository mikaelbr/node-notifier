import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/[!_]*.js'],
    environment: 'node',
    setupFiles: ['./test/_test-matchers.js']
  }
});
