import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    include: ['tests/unit/**/*.test.js', 'tests/integration/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      include: ['js/**/*.js'],
      exclude: ['js/supabase-config.js', 'tests/**'],
      thresholds: {
        lines: 35,
        functions: 40,
        branches: 40,
        statements: 35
      }
    }
  }
});
