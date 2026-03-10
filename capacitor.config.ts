import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.haimhaim.APL',
  appName: '에이쁠',
  server: {
    url: 'https://a-pl.vercel.app',
    cleartext: false, // 프로덕션은 HTTPS만 사용
  },
  // output: 'export' 비활성화로 out 미생성 → public 사용 (sync 시 필수)
  webDir: 'public',
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0f172a",
      showSpinner: false
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;