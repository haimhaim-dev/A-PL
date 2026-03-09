import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.haimhaim.APL',
  appName: 'a-pl',
  // 웹 서버를 직접 바라보게 설정 (http://localhost:3000 사용)
  server: {
    url: 'http://localhost:3000',
    cleartext: true
  },
  // 안드로이드 앱 개발 시에는 필요 없지만 설정은 유지
  webDir: 'out' 
};

export default config;