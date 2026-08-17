import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.abssai.driver',
  appName: 'ABSSAI Driver',
  webDir: 'dist',
  server: {
    url: 'https://driver-abssai.vercel.app',
    cleartext: true,
  }
};

export default config;
