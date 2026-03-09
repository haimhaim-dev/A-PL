# 에이쁠(A-PL) Android 앱 설정 가이드

## 1. 스플래시 화면 ✅
- **리소스**: `app/src/main/res/drawable/splash.xml`, `values/colors.xml`, `values-v31/styles.xml`
- **테마**: `AppTheme.NoActionBarLaunch` — 로딩 중 브랜드 배경 + 아이콘 표시
- **웹에서 숨기기**: `@capacitor/splash-screen` 플러그인으로 앱 준비 후 `SplashScreen.hide()` 호출 권장

## 2. 푸시 알림 (FCM)
- **앱 역할**: 알림을 **받을 수 있는 상태**만 관리 (권한 요청, FCM 토큰 서버 등록). 발송 시점/대상 로직은 앱에 두지 않음.
- **권한**: `AndroidManifest.xml`에 `INTERNET`, `RECEIVE_BOOT_COMPLETED`, `VIBRATE`, `POST_NOTIFICATIONS` 추가됨
- **필수**: Firebase 콘솔에서 프로젝트 생성 후 `google-services.json`을 `android/app/`에 넣고 빌드
- **웹에서**: 앱 최초 실행 시 `@capacitor/push-notifications`로 권한 요청 후 FCM 토큰을 서버에 등록
- **발송 정책 (서버 전담)**: "48시간 지난 사용자에게 아침/저녁에 1회 푸시" — **Node.js 서버 또는 Vercel Cron Job**에서만 처리. 앱 코드에는 넣지 않음.

## 3. 오프라인 화면
- **파일 위치**: 프로젝트 루트 **`public/offline.html`** (관리 편의상 한 곳에서만 유지)
- **웹 연동**: `@capacitor/network`로 연결 끊김 감지 시 `window.location.href = '/offline.html'` 호출하여 오프라인 안내 페이지 표시

## 4. 뒤로가기 버튼 ✅
- **구현**: `MainActivity.java` — 히스토리 있으면 웹뷰 뒤로가기, 없으면 "종료하시겠습니까?" 다이얼로그 (**아니오** / **예** 버튼) 후, "예" 선택 시에만 앱 종료
