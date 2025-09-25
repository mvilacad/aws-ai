/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', 'cdk.out/', '**/*.test.ts'],
    },
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'packages/shared/src'),
      '@functions': path.resolve(__dirname, 'packages/functions/src'),
      '@database': path.resolve(__dirname, 'packages/database/src'),
      '@infrastructure': path.resolve(__dirname, 'packages/infrastructure/lib'),
    },
  },
});
