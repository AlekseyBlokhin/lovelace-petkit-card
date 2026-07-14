import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['test/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: ['src/cards/**/*.styles.js'],
    },
  },
});
