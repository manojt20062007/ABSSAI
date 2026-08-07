import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.abssai.student',
  appName: 'ABSSAI Student',
  webDir: 'dist',
  server: {
    cleartext: true,
  }
};

export default config;
