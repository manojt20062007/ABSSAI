import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.abssai.student',
  appName: 'ABSSAI Student',
  webDir: 'dist',
  server: {
    url: 'https://student-abssai.vercel.app',
    cleartext: true,
  }
};

export default config;
