import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aafiatak.app',
  appName: 'عافيتك',
  webDir: 'out',
  server: {
    url: 'https://aafiatak.vercel.app',
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
