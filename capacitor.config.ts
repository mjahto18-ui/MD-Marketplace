import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mdmarketplace.app',
  appName: 'MD-Marketplace',
  webDir: 'out',
  server: {
    url: 'https://www.md-marketplace.store',
    cleartext: false
  }
};

export default config;
