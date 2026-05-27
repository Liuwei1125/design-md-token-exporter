import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing';

export default defineConfig({
  plugins: [WxtVitest()],
  test: {
    environment: 'jsdom',
    exclude: ['node_modules/**', '.wxt/**', '.output/**', 'references/old-prototype/**'],
    globals: true,
  },
});
