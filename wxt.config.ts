import react from '@vitejs/plugin-react';
import { defineConfig } from 'wxt';
import { APP_DESCRIPTION, APP_NAME, APP_VERSION } from './src/app-meta';

export default defineConfig({
  manifestVersion: 3,
  manifest: {
    name: APP_NAME,
    description: APP_DESCRIPTION,
    version: APP_VERSION,
    icons: {
      16: 'icon/icon-16.png',
      32: 'icon/icon-32.png',
      48: 'icon/icon-48.png',
      128: 'icon/icon-128.png',
    },
    permissions: ['activeTab', 'scripting', 'storage', 'sidePanel'],
    host_permissions: [],
    action: {
      default_icon: {
        16: 'icon/icon-16.png',
        32: 'icon/icon-32.png',
        48: 'icon/icon-48.png',
      },
    },
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
