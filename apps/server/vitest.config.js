import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup/testEnv.js'],
    include: ['tests/**/*.test.js'],
    testTimeout: 15000,
    hookTimeout: 15000,
    // One worker per file, but files run sequentially against the shared
    // test database to avoid cross-file interference from the truncate-
    // based reset in tests/helpers/db.js.
    fileParallelism: false,
  },
});
