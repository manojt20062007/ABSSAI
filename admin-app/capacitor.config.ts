import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.abssai.admin',
  appName: 'ABSSAI Admin',
  webDir: 'dist',
  server: {
    cleartext: true,
  }
};

export default config;
