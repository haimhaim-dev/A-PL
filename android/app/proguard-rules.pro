# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.

# Capacitor WebView 관련 규칙
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Capacitor 플러그인 보존
-keep class com.getcapacitor.** { *; }
-keep class com.capacitorjs.plugins.** { *; }

# Firebase/Google Services 관련
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }

# WebView JavaScript Interface
-keepclassmembers class fqcn.of.javascript.interface.for.webview {
   public *;
}

# 디버깅을 위한 라인 번호 정보 보존
-keepattributes SourceFile,LineNumberTable

# 소스 파일 이름 숨기기
-renamesourcefileattribute SourceFile

# 일반적인 Android 최적화 규칙
-dontwarn com.google.errorprone.annotations.**
-dontwarn java.lang.instrument.ClassFileTransformer
-dontwarn sun.misc.SignalHandler
