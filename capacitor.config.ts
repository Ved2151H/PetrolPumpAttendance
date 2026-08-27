import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.namrata.attendance.v2',
  appName: 'Multi-Firm Management',
  webDir: 'public',
  server: {
    url: 'https://petrol-pump-attendance.vercel.app',
    cleartext: true,
    errorPath: 'error.html'
  },
  android: {
    allowMixedContent: true,
  }
};

export default config;
