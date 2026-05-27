import react from '@vitejs/plugin-react';
import { defineConfig } from 'wxt';

export default defineConfig({
  manifestVersion: 3,
  manifest: {
    name: 'Design.md Token Exporter',
    description: 'Extract local design tokens from the current page and export DESIGN.md artifacts.',
    version: '0.1.0',
    permissions: ['activeTab', 'scripting', 'storage', 'sidePanel'],
    host_permissions: [],
  },
  vite: () => ({
    build: {
      modulePreload: {
        polyfill: false,
      },
    },
    plugins: [react()],
  }),
});
