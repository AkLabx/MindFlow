import path from 'path';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    pool: 'forks',
    testTimeout: 15000,
    exclude: [...configDefaults.exclude, '**/e2e/**'],
  },
});
